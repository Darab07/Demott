import { Redirect, Route, Switch } from "wouter";
import { TourOverlay } from "./components/TourOverlay";
import { CartProvider } from "./lib/cart";
import { FlowContext } from "./lib/flow";
import { PICKUP_CART_KEY } from "./lib/pickup";
import { PickupTourProvider } from "./lib/pickupTour";
import { TourProvider, useTour } from "./lib/tour";
import { Checkout } from "./screens/Checkout";
import { ChooseDemo } from "./screens/ChooseDemo";
import { Menu } from "./screens/Menu";
import { Order } from "./screens/Order";
import { Paid } from "./screens/Paid";
import { PickupMenu } from "./screens/PickupMenu";
import { PickupOrder } from "./screens/PickupOrder";
import { PickupPlaced } from "./screens/PickupPlaced";
import { PickupTrack } from "./screens/PickupTrack";
import { Tip } from "./screens/Tip";

// Two demos: dine-in at /table and Curbside / Pickup at /pickup. Screens use
// paths relative to their demo ("/order", "/checkout"), so checkout is shared.
// Pickup has no tip step: its order screen goes straight to checkout.
export function App() {
  return (
    <CartProvider>
      <TourProvider>
        <Switch>
          <Route path="/table" nest>
            <TableScreens />
          </Route>
          <Route path="/pickup" nest>
            <FlowContext.Provider value="pickup">
              <CartProvider storageKey={PICKUP_CART_KEY}>
                <PickupTourProvider>
                  <PickupScreens />
                  <TourOverlay />
                </PickupTourProvider>
              </CartProvider>
            </FlowContext.Provider>
          </Route>
          <Route component={ChooseDemo} />
        </Switch>
        <TourOverlay />
      </TourProvider>
    </CartProvider>
  );
}

// Re-keyed whenever the tour swaps the table in or out, so every screen
// re-reads the order and payments from scratch.
function TableScreens() {
  const { epoch } = useTour();
  return (
    <Switch key={epoch}>
      <Route path="/" component={Menu} />
      <Route path="/order" component={Order} />
      <Route path="/tip" component={Tip} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/paid" component={Paid} />
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}

// Re-keyed when the Curbside / Pickup tour swaps its sample order in or out.
function PickupScreens() {
  const { epoch } = useTour();
  return (
    <Switch key={epoch}>
      <Route path="/" component={PickupMenu} />
      <Route path="/order" component={PickupOrder} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/paid" component={PickupPlaced} />
      <Route path="/track/:orderNo" component={PickupTrack} />
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}
