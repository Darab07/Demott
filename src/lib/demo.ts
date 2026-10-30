import { resetLedger } from "./payment";

// Start the demo table over: empty order, no payments or payment progress,
// no half-finished checkout. Reloads so every screen starts from scratch.
export function resetDemo() {
  try {
    localStorage.removeItem("tabletap.cart");
  } catch {
    // storage blocked: nothing saved to clear
  }
  resetLedger();
  window.location.replace(`${window.location.origin}/table`);
}

// Start the Curbside / Pickup demo over: empty cart, no orders being tracked,
// and no saved name, number or car, so checkout shows the first-order form.
export function resetPickupDemo() {
  try {
    for (const key of ["tabletap.pickupCart", "tabletap.pickupOrders", "tabletap.pickupOrder", "tabletap.pickupDetails"]) {
      localStorage.removeItem(key);
    }
    sessionStorage.removeItem("tabletap.payment");
  } catch {
    // storage blocked: nothing saved to clear
  }
  window.location.replace(`${window.location.origin}/pickup`);
}
