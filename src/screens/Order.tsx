import { useCallback, useEffect, useState } from "react";
import { Redirect, useLocation } from "wouter";
import { AddButton } from "../components/AddButton";
import { ItemSheet } from "../components/ItemSheet";
import { PayFlow } from "../components/PayFlow";
import { Photo } from "../components/Photo";
import { ChevronDownIcon, ChevronLeftIcon, MinusIcon, PlusIcon, TrashIcon } from "../components/icons";
import { useCart, type LineChoice } from "../lib/cart";
import {
  allItems,
  findItem,
  formatAmount,
  formatPrice,
  hasRequiredOptions,
  unitPrice,
  type MenuItem,
  type Selections,
} from "../lib/menu";
import type { Guest } from "../lib/table";
import { useTour } from "../lib/tour";
import { lineDetails, useTableBill } from "../lib/tableBill";

const MAX_SUGGESTIONS = 6;

export function Order() {
  const cart = useCart();
  const [, navigate] = useLocation();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const closePay = useCallback(() => setPayOpen(false), []);

  // The guided tour opens the pay sheet for its "split it any way" step (and
  // closes it again on Back).
  const tourStep = useTour().step?.id;
  useEffect(() => {
    if (tourStep === "split") setPayOpen(true);
    else if (tourStep === "people") setPayOpen(false);
  }, [tourStep]);

  // Dish card: adding a suggestion, or editing a line (`editKey` + `initial`).
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

  // Arriving from a scrolled menu would otherwise keep that scroll offset.
  // (Braces matter: newer browsers return a Promise from scrollTo, which
  // React would otherwise treat as a cleanup function.)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const bill = useTableBill();
  const { lines, people, tableTotal, ledger, remaining, partlyPaid } = bill;

  // Once a split payment has gone through, the order is locked: guests settle
  // the rest from the menu's payment progress panel instead.
  if (partlyPaid && remaining > 0) return <Redirect to="/" />;

  return (
    <main className="mx-auto min-h-screen max-w-phone pb-[calc(env(safe-area-inset-bottom)+240px)]">
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

      {/* The shared table: your lines are editable, other guests' are read-only. */}
      <section className="mt-[30px] flex flex-col">
        <div data-tour="table-order" className="flex flex-col gap-[15px]">
          {people.map((person) => (
            <div key={person.id} className="flex flex-col gap-[15px]">
              <PersonHeader person={person} total={person.total} />
              {person.isYou ? (
                lines.length > 0 ? (
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
                )
              ) : (
                person.order.map((line, index) => {
                  const item = findItem(line.itemId);
                  return item ? (
                    <OrderLine
                      key={index}
                      item={item}
                      qty={line.qty}
                      selections={line.selections}
                      note={line.note ?? ""}
                    />
                  ) : null;
                })
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="mr-5 mt-[15px] flex items-center gap-[9px] self-end text-base font-medium leading-none underline underline-offset-4"
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
            {partlyPaid ? "Left to pay" : "Table Total"}
            <ChevronDownIcon
              className={`h-6 w-6 transition-transform duration-200 ${showBreakdown ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
          </button>
          <p className="text-black">
            <span className="text-[15px] font-medium">PKR</span>{" "}
            <span className="text-xl font-bold">{formatAmount(remaining)}</span>
          </p>
        </div>
        {partlyPaid && (
          <p className="mt-1.5 text-sm font-medium text-ink-muted">
            PKR {formatAmount(ledger.paidSubtotal)} of PKR {formatAmount(tableTotal)} already paid
          </p>
        )}

        {/* Per-person split, expanded from the chevron. */}
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            showBreakdown ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <ul className="overflow-hidden">
            {people.map((person) => (
              <li key={person.id} className="flex items-center justify-between pt-3 text-[15px] font-medium">
                <span className={person.isYou ? "font-bold" : "text-ink-muted"}>
                  {person.isYou ? `You · ${cart.count} item${cart.count === 1 ? "" : "s"}` : person.name}
                </span>
                <span className={person.isYou ? "font-bold" : "text-ink-muted"}>
                  PKR {formatAmount(person.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          disabled={remaining === 0}
          onClick={() => setPayOpen(true)}
          className="mt-6 w-full rounded-full bg-black py-[22px] text-xl leading-none text-white transition active:scale-[0.98] disabled:opacity-40"
        >
          Pay
        </button>
      </footer>

      <PayFlow open={payOpen} onClose={closePay} bill={bill} />
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

// "Popular with your order": bestsellers not in the order yet, with quick add.
export function PopularWithYourOrder({ onOpen }: { onOpen: (item: MenuItem) => void }) {
  const cart = useCart();
  // Picked once on arrival so a dish doesn't vanish from the row the moment
  // it is added (its tick animation would be cut off).
  const [suggestions] = useState(() =>
    allItems
      .filter((item) => !item.soldOut && cart.countOf(item.id) === 0)
      .sort((a, b) => Number(b.tag === "bestseller") - Number(a.tag === "bestseller"))
      .slice(0, MAX_SUGGESTIONS),
  );

  if (suggestions.length === 0) return null;
  return (
    <section className="mt-9" data-tour="popular">
      <div className="flex flex-col gap-[5px] px-4">
        <h2 className="text-xl font-medium leading-none">Popular with your order</h2>
        <p className="text-base font-bold leading-[1.1] text-ink-muted">Other customers also bought these</p>
      </div>
      <div className="no-scrollbar mt-[30px] flex gap-6 overflow-x-auto px-4 pr-6">
        {suggestions.map((item) => (
          <article key={item.id} className="w-[130px] shrink-0">
            <div className="relative">
              <Photo src={item.image} alt={item.name} className="h-[130px] w-[130px] rounded-[17px]" />
              <AddButton
                name={item.name}
                count={cart.countOf(item.id)}
                onPress={() =>
                  cart.countOf(item.id) > 0 || hasRequiredOptions(item) ? onOpen(item) : cart.add(item.id)
                }
                className="-right-[9px] top-0"
              />
            </div>
            <h3 className="mt-2.5 text-base font-bold leading-tight">{item.name}</h3>
            <p className="mt-2 text-sm font-bold leading-none text-ink-muted">{formatPrice(item.price)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PersonHeader({ person, total }: { person: Guest; total: number }) {
  return (
    <div className="mx-5 flex items-center justify-between border-b border-[#64726e] pb-[5px]">
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-[34px] w-[34px] items-center justify-center rounded-full text-sm font-bold ${
            person.isYou ? "bg-plum text-white" : "bg-ink/[0.06] text-black"
          }`}
        >
          {person.initial}
        </span>
        <h2 className="text-[16.5px] font-bold">{person.name}</h2>
      </div>
      <span className="text-[15px] font-bold">{formatPrice(total)}</span>
    </div>
  );
}

// One dish in the order. With `onEdit`/`onIncrement`/`onDecrement` it is the
// guest's own line (tap to edit, quantity controls); without, it's read-only.
export function OrderLine({
  item,
  qty,
  selections,
  note,
  onEdit,
  onIncrement,
  onDecrement,
}: {
  item: MenuItem;
  qty: number;
  selections: Selections;
  note: string;
  onEdit?: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
}) {
  const details = lineDetails(item, selections, note);

  const summary = (
    <>
      <Photo src={item.image} alt={item.name} className="h-20 w-20 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-col gap-[15px]">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold leading-tight">{item.name}</h3>
          {details && <p className="text-[13px] font-medium leading-snug text-ink-muted">{details}</p>}
        </div>
        <p className="text-sm font-bold leading-none text-ink-muted">{formatPrice(unitPrice(item, selections))}</p>
        {onEdit && (item.options?.length ?? 0) > 0 && (
          <span className="-mt-2 text-xs font-bold text-plum underline underline-offset-2">Edit</span>
        )}
      </div>
    </>
  );

  return (
    <div className="flex items-start justify-between gap-3 px-5">
      {onEdit ? (
        // Tapping your own dish reopens its card to change options, note or quantity.
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${item.name}`}
          className="flex min-w-0 items-start gap-3.5 rounded-xl text-left transition active:opacity-70"
        >
          {summary}
        </button>
      ) : (
        <div className="flex min-w-0 items-start gap-3.5">{summary}</div>
      )}

      {onIncrement && onDecrement ? (
        <div className="flex shrink-0 items-center gap-[15px]">
          <button
            type="button"
            onClick={onDecrement}
            aria-label={qty > 1 ? `Remove one ${item.name}` : `Remove ${item.name}`}
            className="-m-1.5 p-1.5 transition active:scale-90"
          >
            {qty > 1 ? <MinusIcon className="h-5 w-5" /> : <TrashIcon className="h-5 w-5" />}
          </button>
          <span className="min-w-[1ch] text-center text-lg font-bold leading-none" aria-label={`Quantity ${qty}`}>
            {qty}
          </span>
          <button
            type="button"
            onClick={onIncrement}
            aria-label={`Add one more ${item.name}`}
            className="flex h-[35px] w-[35px] items-center justify-center rounded-full bg-plum text-white ring-1 ring-inset ring-hairline transition active:scale-90"
          >
            <PlusIcon className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      ) : (
        qty > 1 && <span className="shrink-0 text-base font-bold text-ink-muted">×{qty}</span>
      )}
    </div>
  );
}
