import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { tapFeedback } from "./haptics";
import { findItem, type Selections } from "./menu";

// One row in the order: a dish with its chosen options and note. The same
// dish with different options is a separate line.
export type CartLine = {
  key: string;
  itemId: string;
  qty: number;
  selections: Selections;
  note: string;
};

export type LineChoice = { selections: Selections; note: string; qty: number };

type Cart = {
  lines: CartLine[];
  count: number;
  countOf: (itemId: string) => number;
  // Merges into an existing line when the dish, options and note all match.
  add: (itemId: string, choice?: Partial<LineChoice>) => void;
  // Replaces a line's options/note/qty (merging if it now matches another line).
  update: (key: string, choice: LineChoice) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void; // drops the line at zero
  clear: () => void;
  replace: (lines: CartLine[]) => void; // swap in a whole order (the guided tour's sample)
};

const CartContext = createContext<Cart | null>(null);
const STORAGE_KEY = "tabletap.cart";

const lineKey = (itemId: string, selections: Selections, note: string) => {
  const sorted = Object.keys(selections)
    .sort()
    .map((group) => `${group}:${[...selections[group]].sort().join(",")}`)
    .join(";");
  return `${itemId}|${sorted}|${note.trim().toLowerCase()}`;
};

// A fresh order line, keyed the same way `add` keys it.
export const cartLine = (itemId: string, { selections = {}, note = "", qty = 1 }: Partial<LineChoice> = {}): CartLine => ({
  key: lineKey(itemId, selections, note),
  itemId,
  qty,
  selections,
  note: note.trim(),
});

// Adds `qty` of a line at its position, or merges into an equal line.
function upsert(lines: CartLine[], itemId: string, { selections, note, qty }: LineChoice, at = lines.length) {
  const key = lineKey(itemId, selections, note);
  if (lines.some((line) => line.key === key)) {
    return lines.map((line) => (line.key === key ? { ...line, qty: line.qty + qty } : line));
  }
  const next = [...lines];
  next.splice(at, 0, { key, itemId, qty, selections, note: note.trim() });
  return next;
}

// Restore the order after a refresh, dropping anything no longer on the menu.
export function loadLines(raw?: string | null, storageKey = STORAGE_KEY): CartLine[] {
  try {
    const saved = JSON.parse((raw === undefined ? localStorage.getItem(storageKey) : raw) ?? "[]");
    return Array.isArray(saved)
      ? saved.filter((line: CartLine) => findItem(line.itemId) && line.qty > 0 && typeof line.key === "string")
      : [];
  } catch {
    return [];
  }
}

// `storageKey` keeps each demo's order apart (dine-in table vs. pickup).
export function CartProvider({ storageKey = STORAGE_KEY, children }: { storageKey?: string; children: ReactNode }) {
  // An array (not a map) so lines keep the order they were added in.
  const [lines, setLines] = useState<CartLine[]>(() => loadLines(undefined, storageKey));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {
      // storage full or blocked: the order just won't survive a reload
    }
  }, [lines, storageKey]);

  const value = useMemo<Cart>(() => {
    const changeQty = (key: string, delta: number) =>
      setLines((prev) =>
        prev
          .map((line) => (line.key === key ? { ...line, qty: line.qty + delta } : line))
          .filter((line) => line.qty > 0),
      );

    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.qty, 0),
      countOf: (itemId) => lines.filter((line) => line.itemId === itemId).reduce((sum, line) => sum + line.qty, 0),
      add: (itemId, { selections = {}, note = "", qty = 1 } = {}) => {
        tapFeedback();
        setLines((prev) => upsert(prev, itemId, { selections, note, qty }));
      },
      update: (key, choice) =>
        setLines((prev) => {
          const index = prev.findIndex((line) => line.key === key);
          if (index === -1) return prev;
          const { itemId } = prev[index];
          const rest = prev.filter((line) => line.key !== key);
          return upsert(rest, itemId, choice, index);
        }),
      increment: (key) => {
        tapFeedback();
        changeQty(key, 1);
      },
      decrement: (key) => {
        tapFeedback(8);
        changeQty(key, -1);
      },
      clear: () => setLines([]),
      replace: (next) => setLines(next),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside <CartProvider>");
  return cart;
}
