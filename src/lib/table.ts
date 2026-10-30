import { findItem, unitPrice, type Selections } from "./menu";

// Demo table: who has joined Table #1. The other guests' orders are fixed so
// every run of the demo shows the same shared cart; only "you" is live.
export type GuestLine = { itemId: string; qty: number; selections: Selections; note?: string };

export type Guest = {
  id: string;
  name: string;
  initial: string;
  isYou?: boolean;
  joined?: boolean; // just scanned in
  order: GuestLine[]; // empty for "you" (that comes from the live cart)
};

export const guests: Guest[] = [
  { id: "you", name: "You", initial: "Y", isYou: true, order: [] },
  {
    id: "g1",
    name: "Guest 1",
    initial: "1",
    order: [
      { itemId: "classic-smash-burger", qty: 1, selections: { extras: ["beef-bacon"] } },
      { itemId: "coca-cola", qty: 1, selections: {} },
    ],
  },
  {
    id: "g2",
    name: "Guest 2",
    initial: "2",
    joined: true,
    order: [
      { itemId: "chicken-caesar-salad", qty: 1, selections: { extras: ["extra-chicken"] } },
      { itemId: "vanilla-shake", qty: 1, selections: {} },
    ],
  },
];

export const linesTotal = (lines: GuestLine[]) =>
  lines.reduce((sum, line) => {
    const item = findItem(line.itemId);
    return item ? sum + unitPrice(item, line.selections) * line.qty : sum;
  }, 0);
