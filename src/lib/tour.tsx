import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { cartLine, loadLines, useCart, type CartLine } from "./cart";
import { findItem, unitPrice } from "./menu";
import { resetLedger, saveLedger, savePayment, type CompletedPayment } from "./payment";
import { guests, linesTotal } from "./table";

// Guided tour of the demo: eight steps that walk through ordering, ordering
// together, splitting and paying. It runs on a sample table (a ready-made
// order, a pending payment, a part-paid bill) and puts the guest's own order
// and payments back when it is skipped or finished.

export type TourStep = {
  id: string;
  title: string;
  body: string;
  target: string; // CSS selector for the highlighted element
  placement: "above" | "below"; // preferred side for the tooltip
  scroll?: boolean; // bring the target into view first (it may start off screen)
};

export const tourSteps: TourStep[] = [
  {
    id: "browse",
    title: "Browse & order in seconds",
    body: "Guests see the whole menu with photos and tap to add — no app to download, no waiting for staff.",
    target: "#category-breakfast article",
    placement: "below",
  },
  {
    id: "dish",
    title: "Customise every order",
    body: "Options, add-ons and notes are captured exactly — fewer mistakes, bigger tickets.",
    target: '[data-tour="dish-options"]',
    placement: "above",
  },
  {
    id: "together",
    title: "Order together",
    body: "Tap here to invite the table — everyone joins one shared cart from their own phone.",
    target: 'main > section button[aria-label="Order together"]',
    placement: "below",
  },
  {
    id: "qr",
    title: "No app to download",
    body: "Friends scan the QR or tap the link to join the table — anyone can order in seconds.",
    target: '[data-tour="table-qr"]',
    placement: "below",
  },
  {
    id: "people",
    title: "See who ordered what",
    body: "Everyone’s items sit under their own name and roll up into one shared bill — no tabs to reconcile.",
    target: '[data-tour="table-order"]',
    placement: "below",
  },
  {
    id: "split",
    title: "Split it any way",
    body: "Split by item, divide evenly, or pay in full — each guest settles their share in a tap.",
    target: 'section[aria-labelledby="pay-bill-title"]',
    placement: "above",
  },
  {
    id: "pay",
    title: "Pay on the phone",
    body: "Debit card, JazzCash or Easypaisa — guests pay from their seat, no machine passed around.",
    target: '[role="radiogroup"][aria-label="Payment method"]',
    placement: "below",
  },
  {
    id: "sync",
    title: "Everyone stays in sync",
    body: "As each guest pays their share, the table sees the bill update live — right down to who’s paid.",
    target: '[aria-label="Payment progress"]',
    placement: "above",
  },
];

// The dish shown on the customise step, with choices already made.
export const tourDish = {
  itemId: "boathouse-breakfast",
  choice: { selections: { eggs: ["poached"], extras: ["extra-egg"] }, note: "", qty: 1 },
};

// "Your" sample order from the order-together step on.
const sampleLines = (): CartLine[] => [
  cartLine(tourDish.itemId, tourDish.choice),
  cartLine("eggs-benedict", { selections: { base: ["english-muffin"] } }),
];

const SAMPLE_SHARES = 4;

const SEEN_KEY = "tabletap.tourSeen";
const BACKUP_KEY = "tabletap.tourBackup";
const CART_KEY = "tabletap.cart";
const LEDGER_KEY = "tabletap.ledger";
const PAYMENT_KEY = "tabletap.payment";

// The guest's own table state, saved while the tour borrows the table.
type Backup = { cart: string | null; ledger: string | null; payment: string | null };

function storage(kind: "local" | "session") {
  try {
    return kind === "local" ? localStorage : sessionStorage;
  } catch {
    return null;
  }
}

function readBackup(): Backup | null {
  try {
    return JSON.parse(storage("local")?.getItem(BACKUP_KEY) ?? "null");
  } catch {
    return null;
  }
}

function setRaw(kind: "local" | "session", key: string, value: string | null) {
  try {
    if (value === null) storage(kind)?.removeItem(key);
    else storage(kind)?.setItem(key, value);
  } catch {
    // storage blocked: the tour still runs, it just can't be undone after a reload
  }
}

export function tourSeen() {
  return storage("local")?.getItem(SEEN_KEY) === "1";
}

function sampleTotals(lines: CartLine[]) {
  const yours = lines.reduce((sum, line) => {
    const item = findItem(line.itemId);
    return item ? sum + unitPrice(item, line.selections) * line.qty : sum;
  }, 0);
  return yours + guests.reduce((sum, guest) => sum + linesTotal(guest.order), 0);
}

// One guest has paid an equal share of the sample table.
function samplePartPaidTable(lines: CartLine[]) {
  const tableTotal = sampleTotals(lines);
  const amount = Math.round(tableTotal / SAMPLE_SHARES);
  const tip = Math.round(amount * 0.2);
  const fee = Math.round(amount * 0.01);
  const payment: CompletedPayment = {
    receiptNo: "BH-TOUR-0001",
    reference: "000000000000",
    paidAt: new Date().toISOString(),
    kind: "equal",
    items: [],
    share: { payingFor: 1, people: SAMPLE_SHARES, tableBalance: tableTotal },
    remainingAfter: tableTotal - amount,
    amount,
    discount: 0,
    tip,
    tipPercent: 20,
    fee,
    total: amount + tip + fee,
    method: "Easypaisa",
    settled: false,
  };
  saveLedger({ paidSubtotal: amount, paidTotal: payment.total, paidLineKeys: [], payments: [payment], last: payment });
}

// Shared by the dine-in tour here and the Curbside / Pickup one, so the same
// overlay and buttons drive whichever is running.
export type Tour = {
  steps: TourStep[];
  step: TourStep | null;
  index: number;
  epoch: number; // bumped when the table is swapped, so screens remount and re-read it
  start: () => void;
  next: () => void;
  back: () => void;
  end: () => void; // skip or finish
};

export const TourContext = createContext<Tour | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const cart = useCart();
  const [, navigate] = useLocation();
  const [index, setIndex] = useState(-1);
  const [epoch, setEpoch] = useState(0);

  const restore = useCallback(() => {
    const backup = readBackup();
    if (!backup) return;
    setRaw("local", CART_KEY, backup.cart);
    setRaw("local", LEDGER_KEY, backup.ledger);
    setRaw("session", PAYMENT_KEY, backup.payment);
    setRaw("local", BACKUP_KEY, null);
    cart.replace(loadLines(backup.cart));
  }, [cart]);

  // A reload mid-tour leaves the sample table behind: put the guest's back.
  useEffect(() => {
    if (readBackup()) {
      restore();
      setEpoch((e) => e + 1);
    }
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => {
    if (!readBackup()) {
      const backup: Backup = {
        cart: storage("local")?.getItem(CART_KEY) ?? null,
        ledger: storage("local")?.getItem(LEDGER_KEY) ?? null,
        payment: storage("session")?.getItem(PAYMENT_KEY) ?? null,
      };
      setRaw("local", BACKUP_KEY, JSON.stringify(backup));
    }
    setRaw("local", SEEN_KEY, "1");
    resetLedger();
    cart.replace([]);
    setEpoch((e) => e + 1);
    setIndex(0);
    navigate("/table");
  }, [cart, navigate]);

  const end = useCallback(() => {
    restore();
    setIndex(-1);
    setEpoch((e) => e + 1);
    navigate("/table");
    window.scrollTo(0, 0);
  }, [restore, navigate]);

  // Sets the sample table up for a step from scratch, so Next and Back both
  // land on it the same way.
  const goTo = useCallback(
    (target: number) => {
      const id = tourSteps[target].id;
      const lines = sampleLines();
      cart.replace(target >= 2 ? lines : []);
      if (id === "sync") samplePartPaidTable(lines);
      else resetLedger();
      if (id === "pay") {
        const total = sampleTotals(lines);
        savePayment({ amount: total, kind: "full", remaining: total, items: [] });
      }
      navigate(id === "people" || id === "split" ? "/table/order" : id === "pay" ? "/table/checkout" : "/table");
      setIndex(target);
    },
    [cart, navigate],
  );

  const next = useCallback(() => {
    if (index + 1 >= tourSteps.length) return end();
    goTo(index + 1);
  }, [index, goTo, end]);

  const back = useCallback(() => {
    if (index > 0) goTo(index - 1);
  }, [index, goTo]);

  const value = useMemo<Tour>(
    () => ({ steps: tourSteps, step: tourSteps[index] ?? null, index, epoch, start, next, back, end }),
    [index, epoch, start, next, back, end],
  );
  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const tour = useContext(TourContext);
  if (!tour) throw new Error("useTour must be used inside <TourProvider>");
  return tour;
}
