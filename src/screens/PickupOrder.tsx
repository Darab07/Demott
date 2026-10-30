import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ItemSheet } from "../components/ItemSheet";
import { PickupModeToggle } from "../components/PickupModePicker";
import { ChevronDownIcon, ChevronLeftIcon, PlusIcon } from "../components/icons";
import { useCart, type LineChoice } from "../lib/cart";
import { findItem, formatAmount, unitPrice, type MenuItem } from "../lib/menu";
import { INSTANT_FEE_RATE, savePayment } from "../lib/payment";
import { lineDetails } from "../lib/tableBill";
import { OrderLine, PopularWithYourOrder } from "./Order";

// Pickup order: just the guest's own dishes (no table, guests, splitting or
// tip), how they'll collect it, then straight on to checkout.
export function PickupOrder() {
  const cart = useCart();
  const [, navigate] = useLocation();
  const [showBreakdown, setShowBreakdown] = useState(false);

  const [sheet, setSheet] = useState<{ item: MenuItem; editKey?: string; initial?: LineChoice } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const openSheet = (next: NonNullable<typeof sheet>) => {
    setSheet(next);
    setSheetOpen(true);
  };
  const submitSheet = (item: MenuItem, choice: LineChoice) => {
    if (sheet?.editKey) cart.update(sheet.editKey, choice);
    else cart.add(item.id, choice);
    setSheetOpen(false);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const lines = cart.lines
    .map((line) => ({ ...line, item: findItem(line.itemId) }))
    .filter((line): line is typeof line & { item: MenuItem } => !!line.item);
  const subtotal = lines.reduce((sum, line) => sum + unitPrice(line.item, line.selections) * line.qty, 0);
  const fee = Math.round(subtotal * INSTANT_FEE_RATE);
  const total = subtotal + fee;

  const checkout = () => {
    savePayment({
      amount: subtotal,
      kind: "full",
      remaining: subtotal,
      lineKeys: lines.map((line) => line.key),
      items: lines.map(({ item, qty, selections, note }) => ({
        name: item.name,
        qty,
        total: unitPrice(item, selections) * qty,
        details: lineDetails(item, selections, note),
      })),
    });
    navigate("/checkout");
  };

  return (
    <main className="mx-auto min-h-screen max-w-phone pb-[calc(env(safe-area-inset-bottom)+200px)]">
      <header className="grid grid-cols-[44px_1fr_44px] items-center px-5 pt-[calc(env(safe-area-inset-top)+22px)]">
        <button
          type="button"
          aria-label="Back to menu"
          onClick={() => navigate("/")}
          className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-inset ring-hairline"
        >
          <ChevronLeftIcon className="h-5 w-5" strokeWidth={2} />
        </button>
        <h1 className="text-center text-2xl font-medium leading-none">Your Order</h1>
      </header>

      <PickupModeToggle className="mx-5 mt-3" />

      <section className="mt-[30px] flex flex-col gap-[15px]">
        {lines.length > 0 ? (
          lines.map(({ key, item, qty, selections, note }) => (
            <OrderLine
              key={key}
              item={item}
              qty={qty}
              selections={selections}
              note={note}
              onEdit={() => openSheet({ item, editKey: key, initial: { selections, note, qty } })}
              onIncrement={() => cart.increment(key)}
              onDecrement={() => cart.decrement(key)}
            />
          ))
        ) : (
          <p className="px-5 text-sm font-medium text-ink-muted">Nothing added yet.</p>
        )}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mr-5 flex items-center gap-[9px] self-end text-base font-medium leading-none underline underline-offset-4"
        >
          <PlusIcon className="h-[15px] w-[15px]" strokeWidth={2} />
          Add more items
        </button>
      </section>

      <PopularWithYourOrder onOpen={(item) => openSheet({ item })} />

      <footer className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-phone rounded-t-[23px] bg-white px-[17px] pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowBreakdown((s) => !s)}
            aria-expanded={showBreakdown}
            className="flex items-center gap-[5px] text-xl font-bold leading-none text-black"
          >
            Total
            <ChevronDownIcon
              className={`h-6 w-6 transition-transform duration-200 ${showBreakdown ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
          </button>
          <p className="text-black">
            <span className="text-[15px] font-medium">PKR</span>{" "}
            <span className="text-xl font-bold">{formatAmount(total)}</span>
          </p>
        </div>

        {/* Subtotal and fees, expanded from the chevron. */}
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            showBreakdown ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <ul className="overflow-hidden text-[15px] font-medium text-ink-muted">
            <li className="flex items-center justify-between pt-3">
              <span>Subtotal</span>
              <span>PKR {formatAmount(subtotal)}</span>
            </li>
            <li className="flex items-center justify-between pt-3">
              <span>Instant payment fees</span>
              <span>PKR {formatAmount(fee)}</span>
            </li>
          </ul>
        </div>

        <button
          type="button"
          disabled={subtotal === 0}
          onClick={checkout}
          className="mt-6 w-full rounded-full bg-black py-[22px] text-lg font-medium leading-none text-white transition active:scale-[0.98] disabled:opacity-40"
        >
          Checkout · PKR {formatAmount(total)}
        </button>
      </footer>

      <ItemSheet
        item={sheet?.item ?? null}
        open={sheetOpen}
        initial={sheet?.initial}
        onClose={closeSheet}
        onSubmit={submitSheet}
      />
    </main>
  );
}
