import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { cartLine, loadLines, useCart, type CartLine } from "./cart";
import { findItem, unitPrice } from "./menu";
import { savePayment, type CompletedPayment } from "./payment";
import {
  PICKUP_CART_KEY,
  savePickupDetails,
  setPickupMode,
  type PickupDetails,
  type PickupMode,
  type PickupOrder,
} from "./pickup";
import { lineDetails } from "./tableBill";
import { TourContext, tourDish, type Tour, type TourStep } from "./tour";

// Guided tour of the Curbside / Pickup demo: seven steps from choosing how to
// collect, through checkout, to "I'm here" and tracking from the menu. Like
// the dine-in tour it runs on a sample order and puts the guest's own cart,
// orders and saved details back when it's skipped or finished.

export const pickupTourSteps: TourStep[] = [
  {
    id: "mode",
    title: "Pickup or curbside",
    body: "One menu, two ways to collect: from the counter, or brought out to the car. Customers see the ready time before they order.",
    target: '[data-tour="pickup-mode"], [data-tour="pickup-mode-menu"]',
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
    id: "upsell",
    title: "Upsell on every order",
    body: "“Popular with your order” suggests what customers usually add — and they can switch between Pickup and Curbside right up to checkout.",
    target: '[data-tour="popular"]',
    placement: "above",
    scroll: true,
  },
  {
    id: "details",
    title: "Repeat customers check out in a tap",
    body: "Just a name, number and car. They’re saved after the first order, so next time it’s straight to Pay.",
    target: '[data-tour="pickup-details"]',
    placement: "below",
    scroll: true,
  },
  {
    id: "pay",
    title: "Paid before it’s cooked",
    body: "Easypaisa, JazzCash or card, plus promo codes for campaigns. Every order is prepaid — no no-shows.",
    target: '[role="radiogroup"][aria-label="Payment method"]',
    placement: "above",
    scroll: true,
  },
  {
    id: "checkin",
    title: "“I’m here” — and it’s brought out",
    body: "Customers get an order number and live tracking. When they park, one tap tells the team to bring it to their car.",
    target: '[data-tour="checkin"]',
    placement: "below",
  },
  {
    id: "card",
    title: "Track every order from the menu",
    body: "Active orders stay on the menu with live progress — customers swipe between them when they have more than one.",
    target: '[data-tour="active-orders"]',
    placement: "above",
  },
];

const SEEN_KEY = "tabletap.pickupTourSeen";
const BACKUP_KEY = "tabletap.pickupTourBackup";
// Everything the tour borrows, so it can be put back exactly.
const LOCAL_KEYS = [PICKUP_CART_KEY, "tabletap.pickupOrders", "tabletap.pickupDetails", "tabletap.pickupMode"];
const SESSION_KEYS = ["tabletap.payment"];
const ORDERS_KEY = "tabletap.pickupOrders";

type Backup = { local: Record<string, string | null>; session: Record<string, string | null> };

function storage(kind: "local" | "session") {
  try {
    return kind === "local" ? localStorage : sessionStorage;
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

function readBackup(): Backup | null {
  try {
    return JSON.parse(storage("local")?.getItem(BACKUP_KEY) ?? "null");
  } catch {
    return null;
  }
}

// Puts the guest's own storage back; returns their saved cart, or undefined
// when there was no tour to undo.
function restoreStorage(): string | null | undefined {
  const backup = readBackup();
  if (!backup) return undefined;
  for (const key of LOCAL_KEYS) setRaw("local", key, backup.local[key] ?? null);
  for (const key of SESSION_KEYS) setRaw("session", key, backup.session[key] ?? null);
  setRaw("local", BACKUP_KEY, null);
  setPickupMode(backup.local["tabletap.pickupMode"] === "curbside" ? "curbside" : "pickup");
  return backup.local[PICKUP_CART_KEY] ?? null;
}

// Checked once per page load (React may create the provider twice).
let reloadChecked = false;
let reloadedCart: string | null | undefined;
function restoreAfterReload() {
  if (!reloadChecked) {
    reloadChecked = true;
    reloadedCart = restoreStorage();
  }
  return reloadedCart;
}

export function pickupTourSeen() {
  return storage("local")?.getItem(SEEN_KEY) === "1";
}

const sampleLines = (): CartLine[] => [
  cartLine(tourDish.itemId, tourDish.choice),
  cartLine("eggs-royale", { qty: 2 }),
];

const sampleDetails: PickupDetails = {
  name: "Ayesha Khan",
  phone: "0300 1234567",
  car: { plate: "LEB 1234", model: "White Toyota Corolla", spot: "near the entrance" },
};

function receiptItems(lines: CartLine[]) {
  return lines.flatMap((line) => {
    const item = findItem(line.itemId);
    if (!item) return [];
    const total = unitPrice(item, line.selections) * line.qty;
    return [{ name: item.name, qty: line.qty, total, details: lineDetails(item, line.selections, line.note) }];
  });
}

// A paid sample order, placed `minutesAgo`.
function sampleOrder(orderNo: string, mode: PickupMode, minutesAgo: number): PickupOrder {
  const items = receiptItems(sampleLines());
  const amount = items.reduce((sum, item) => sum + item.total, 0);
  const fee = Math.round(amount * 0.01);
  const payment: CompletedPayment = {
    receiptNo: `BH-TOUR-${orderNo.slice(-4)}`,
    reference: "000000000000",
    paidAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    kind: "full",
    items,
    remainingAfter: 0,
    amount,
    discount: 0,
    tip: 0,
    fee,
    total: amount + fee,
    method: "Easypaisa",
    settled: true,
    pickup: { orderNo, mode, name: sampleDetails.name },
  };
  return {
    orderNo,
    mode,
    name: sampleDetails.name,
    phone: sampleDetails.phone,
    car: mode === "curbside" ? sampleDetails.car : undefined,
    payment,
  };
}

// Sits inside the Curbside / Pickup routes (and their cart), so paths here
// are relative to /pickup.
export function PickupTourProvider({ children }: { children: ReactNode }) {
  const cart = useCart();
  const [, navigate] = useLocation();
  const [index, setIndex] = useState(-1);
  const [epoch, setEpoch] = useState(0);

  // A reload mid-tour leaves the sample order behind: put the guest's back.
  // Done while this provider is first created, before any screen's effects
  // (the menu may start a new tour as soon as it mounts).
  const [savedCart] = useState(restoreAfterReload);
  useEffect(() => {
    if (savedCart === undefined) return;
    cart.replace(loadLines(savedCart, PICKUP_CART_KEY));
    setEpoch((e) => e + 1);
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restore = useCallback(() => {
    const saved = restoreStorage();
    if (saved !== undefined) cart.replace(loadLines(saved, PICKUP_CART_KEY));
  }, [cart]);

  const start = useCallback(() => {
    if (!readBackup()) {
      const backup: Backup = { local: {}, session: {} };
      for (const key of LOCAL_KEYS) backup.local[key] = storage("local")?.getItem(key) ?? null;
      for (const key of SESSION_KEYS) backup.session[key] = storage("session")?.getItem(key) ?? null;
      setRaw("local", BACKUP_KEY, JSON.stringify(backup));
    }
    setRaw("local", SEEN_KEY, "1");
    // A clean slate: no orders on the menu, nothing in the cart, and Curbside
    // so the tour can show "I'm here".
    for (const key of LOCAL_KEYS) if (key !== PICKUP_CART_KEY) setRaw("local", key, null);
    for (const key of SESSION_KEYS) setRaw("session", key, null);
    setPickupMode("curbside");
    cart.replace([]);
    setEpoch((e) => e + 1);
    setIndex(0);
    navigate("/");
    window.scrollTo(0, 0);
  }, [cart, navigate]);

  const end = useCallback(() => {
    restore();
    setIndex(-1);
    setEpoch((e) => e + 1);
    navigate("/");
    window.scrollTo(0, 0);
  }, [restore, navigate]);

  // Sets the sample order up for a step from scratch, so Next and Back both
  // land on it the same way.
  const goTo = useCallback(
    (target: number) => {
      const id = pickupTourSteps[target].id;
      const lines = sampleLines();
      const atCheckout = id === "details" || id === "pay";
      cart.replace(id === "upsell" || atCheckout ? lines : []);
      if (atCheckout) {
        const items = receiptItems(lines);
        const amount = items.reduce((sum, item) => sum + item.total, 0);
        savePickupDetails(sampleDetails);
        savePayment({ amount, kind: "full", remaining: amount, lineKeys: lines.map((l) => l.key), items });
      } else {
        setRaw("local", "tabletap.pickupDetails", null);
        setRaw("session", "tabletap.payment", null);
      }
      if (id === "checkin") {
        setRaw("local", ORDERS_KEY, JSON.stringify([sampleOrder("BH-2047", "curbside", 2)]));
      } else if (id === "card") {
        // The curbside order is now on its way, and a second order shows the
        // swipe between them.
        const curbside = { ...sampleOrder("BH-2047", "curbside", 6), arrivedAt: new Date(Date.now() - 8_000).toISOString() };
        setRaw("local", ORDERS_KEY, JSON.stringify([sampleOrder("BH-2052", "pickup", 3), curbside]));
      } else {
        setRaw("local", ORDERS_KEY, null);
      }
      setPickupMode("curbside");
      navigate(id === "upsell" ? "/order" : atCheckout ? "/checkout" : id === "checkin" ? "/track/BH-2047" : "/");
      setIndex(target);
    },
    [cart, navigate],
  );

  const next = useCallback(() => {
    if (index + 1 >= pickupTourSteps.length) return end();
    goTo(index + 1);
  }, [index, goTo, end]);

  const back = useCallback(() => {
    if (index > 0) goTo(index - 1);
  }, [index, goTo]);

  const value = useMemo<Tour>(
    () => ({ steps: pickupTourSteps, step: pickupTourSteps[index] ?? null, index, epoch, start, next, back, end }),
    [index, epoch, start, next, back, end],
  );
  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
