import { useEffect, useState, useSyncExternalStore } from "react";
import type { CompletedPayment } from "./payment";

// Curbside / Pickup demo: how the guest collects their order, and the order
// they've placed (shown on the order-placed screen).

export type PickupMode = "pickup" | "curbside";

export const pickupModes: { id: PickupMode; name: string; description: string }[] = [
  { id: "pickup", name: "Pickup", description: "Collect it from the counter" },
  { id: "curbside", name: "Curbside", description: "We bring it out to your car" },
];

export const READY_IN = "15–20 min";

const MODE_KEY = "tabletap.pickupMode";
const ORDERS_KEY = "tabletap.pickupOrders";
const OLD_ORDER_KEY = "tabletap.pickupOrder"; // single order, before several were kept
const DETAILS_KEY = "tabletap.pickupDetails";
export const PICKUP_CART_KEY = "tabletap.pickupCart";

function readMode(): PickupMode {
  try {
    return localStorage.getItem(MODE_KEY) === "curbside" ? "curbside" : "pickup";
  } catch {
    return "pickup";
  }
}

// One shared value, so the menu pill and checkout always agree.
let currentMode = readMode();
const listeners = new Set<() => void>();

export function setPickupMode(mode: PickupMode) {
  currentMode = mode;
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // storage blocked: the choice lasts for this page load
  }
  listeners.forEach((listener) => listener());
}

export function usePickupMode() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => currentMode,
  );
}

// model: make, model and colour in one, e.g. "White Toyota Corolla".
export type CarDetails = { plate: string; model: string; spot: string };

export type PickupOrder = {
  orderNo: string; // short number called out at the counter / shown to the runner
  mode: PickupMode;
  name: string;
  phone: string;
  car?: CarDetails; // curbside only
  arrivedAt?: string; // curbside: when the guest tapped "I'm here" (ISO)
  dismissed?: boolean; // tracking card hidden on the menu
  payment: CompletedPayment;
};

// Every order placed on this device, oldest first.
export function loadPickupOrders(): PickupOrder[] {
  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) ?? "null");
    if (Array.isArray(orders)) return orders;
    const old = JSON.parse(localStorage.getItem(OLD_ORDER_KEY) ?? "null");
    return old ? [old] : [];
  } catch {
    return [];
  }
}

// One order by number, or the latest one placed.
export function loadPickupOrder(orderNo?: string): PickupOrder | null {
  const orders = loadPickupOrders();
  return (orderNo ? orders.find((o) => o.orderNo === orderNo) : orders[orders.length - 1]) ?? null;
}

// Adds a new order, or updates the one with the same number.
export function savePickupOrder(order: PickupOrder) {
  const orders = loadPickupOrders();
  const index = orders.findIndex((o) => o.orderNo === order.orderNo);
  if (index >= 0) orders[index] = order;
  else orders.push(order);
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    localStorage.removeItem(OLD_ORDER_KEY);
  } catch {
    // storage blocked: the order screens still show for this page load
  }
}

// The guest's name, number and car, remembered on this device after their
// first order so checkout is pre-filled next time.
export type PickupDetails = { name: string; phone: string; car: CarDetails };

export function loadPickupDetails(): PickupDetails | null {
  try {
    return JSON.parse(localStorage.getItem(DETAILS_KEY) ?? "null");
  } catch {
    return null;
  }
}

export function savePickupDetails(details: PickupDetails) {
  try {
    localStorage.setItem(DETAILS_KEY, JSON.stringify(details));
  } catch {
    // storage blocked: they'll type them again next time
  }
}

// Demo pacing: how long after each moment the next stage starts, so the whole
// journey can be shown in one sitting.
const ACCEPTED_AFTER_MS = 3_000; // after the order is placed
const PICKUP_READY_AFTER_MS = 25_000; // pickup: after the order is placed
const ON_ITS_WAY_AFTER_MS = 6_000; // curbside: after "I'm here"
const DELIVERED_AFTER_MS = 14_000; // curbside: after "I'm here"

export const stepLabels: Record<PickupMode, string[]> = {
  curbside: ["Order placed", "Accepted", "Preparing", "On its way to your car", "Delivered to your car"],
  pickup: ["Order placed", "Accepted", "Preparing", "Ready at the counter", "Collected"],
};

// When each stage starts (ms since epoch; Infinity = not yet).
function stageTimes(order: PickupOrder) {
  const placed = Date.parse(order.payment.paidAt);
  const accepted = placed + ACCEPTED_AFTER_MS;
  if (order.mode === "pickup") return [placed, accepted, accepted, placed + PICKUP_READY_AFTER_MS, Infinity];
  const arrived = order.arrivedAt ? Date.parse(order.arrivedAt) : Infinity;
  return [placed, accepted, accepted, arrived + ON_ITS_WAY_AFTER_MS, arrived + DELIVERED_AFTER_MS];
}

// Where the order is at, re-checked every second while a stage is still to
// come. `current` indexes stepLabels; `finished` once delivered to the car.
export function useOrderProgress(order: PickupOrder | null) {
  const [now, setNow] = useState(Date.now);
  const times = order ? stageTimes(order) : [];
  const current = times.filter((t) => t <= now).length - 1;
  const finished = order?.mode === "curbside" && current === 4;

  useEffect(() => {
    if (!order || finished) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [order, finished]);

  const curbside = order?.mode === "curbside";
  const onItsWay = curbside && current === 3;
  const ready = !curbside && current === 3;
  const status = finished ? "Delivered" : onItsWay ? "On its way" : ready ? "Ready to collect" : "Preparing";
  return { times, current, finished, onItsWay, ready, status };
}
