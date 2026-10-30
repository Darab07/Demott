// Payment flow state.
//
// - PendingPayment: what the guest chose on the pay sheet, carried through the
//   tip and checkout screens (sessionStorage, so a refresh mid-flow keeps it).
// - Ledger: what has already been paid at this table (localStorage, alongside
//   the saved cart), so a split leaves only the remaining balance to pay.
export type PaymentKind = "full" | "equal" | "items";

// A line on the receipt: a dish (or the guest's equal share of the bill).
export type ReceiptItem = { name: string; qty: number; total: number; details?: string };
// tableBalance: the whole table bill the shares are taken from.
export type EqualShare = { payingFor: number; people: number; tableBalance: number };

export type PendingPayment = {
  amount: number; // food amount being paid, before tip
  kind: PaymentKind;
  remaining?: number; // table balance before this payment
  lineKeys?: string[]; // order lines covered ("Pay for your items")
  items?: ReceiptItem[]; // dishes this payment covers, for the receipt
  share?: EqualShare; // set for "Divide the bill equally"
  tip?: number; // set on the tip screen
  tipPercent?: number | null; // null for a custom amount
};

export type CompletedPayment = {
  receiptNo: string;
  reference: string; // payment provider's transaction id
  paidAt: string; // ISO date-time
  kind: PaymentKind;
  items: ReceiptItem[];
  share?: EqualShare;
  remainingAfter: number; // table balance left once this payment went through
  amount: number;
  discount: number;
  tip: number;
  tipPercent?: number | null;
  fee: number;
  total: number; // what was charged
  method: string;
  email?: string;
  settled: boolean; // this payment cleared the table's balance
  pickup?: { orderNo: string; mode: "pickup" | "curbside"; name: string }; // Curbside / Pickup orders
};

export type Ledger = {
  paidSubtotal: number; // food amounts settled so far
  paidTotal: number; // everything charged so far (incl. tips and fees)
  paidLineKeys: string[];
  payments: CompletedPayment[]; // oldest first
  last?: CompletedPayment;
};

export const INSTANT_FEE_RATE = 0.01; // provider fee for instant transfers

const PENDING_KEY = "tabletap.payment";
const LEDGER_KEY = "tabletap.ledger";
const EMPTY_LEDGER: Ledger = { paidSubtotal: 0, paidTotal: 0, paidLineKeys: [], payments: [] };

function read<T>(storage: () => Storage, key: string): T | null {
  try {
    return JSON.parse(storage().getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: unknown) {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, JSON.stringify(value));
  } catch {
    // storage blocked: the flow still works within this page load
  }
}

export function savePayment(payment: PendingPayment) {
  write(() => sessionStorage, PENDING_KEY, payment);
}

export function loadPayment(): PendingPayment | null {
  const saved = read<PendingPayment>(() => sessionStorage, PENDING_KEY);
  return saved && typeof saved.amount === "number" && saved.amount > 0 ? saved : null;
}

export function loadLedger(): Ledger {
  return { ...EMPTY_LEDGER, ...read<Ledger>(() => localStorage, LEDGER_KEY) };
}

// Adds a finished payment to the table's ledger and clears the pending one.
export function recordPayment(payment: CompletedPayment, lineKeys: string[] = []) {
  const ledger = loadLedger();
  write(() => localStorage, LEDGER_KEY, {
    paidSubtotal: ledger.paidSubtotal + payment.amount,
    paidTotal: ledger.paidTotal + payment.total,
    paidLineKeys: [...ledger.paidLineKeys, ...lineKeys],
    payments: [...ledger.payments, payment],
    last: payment,
  } satisfies Ledger);
  write(() => sessionStorage, PENDING_KEY, null);
}

// Overwrites the whole ledger (the guided tour's sample part-paid table).
export function saveLedger(ledger: Ledger) {
  write(() => localStorage, LEDGER_KEY, ledger);
}

// Fresh table for the next run of the demo.
export function resetLedger() {
  write(() => localStorage, LEDGER_KEY, null);
  write(() => sessionStorage, PENDING_KEY, null);
}
