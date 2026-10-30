import { useEffect, useState } from "react";
import type { BillParty } from "../components/PayBillSheet";
import { useCart, type CartLine } from "./cart";
import { findItem, selectedChoices, unitPrice, type MenuItem, type Selections } from "./menu";
import { loadLedger, resetLedger } from "./payment";
import { guests, linesTotal } from "./table";

// "Mild · Extra poached egg · “no chilli”" for a line's chosen options and note.
export function lineDetails(item: MenuItem, selections: Selections, note: string) {
  return [...selectedChoices(item, selections).map((choice) => choice.name), note && `“${note}”`]
    .filter(Boolean)
    .join(" · ");
}

// The whole table's bill: your live cart plus the other guests' fixed orders,
// minus whatever has already been paid.
export function useTableBill() {
  const cart = useCart();
  const [ledger, setLedger] = useState(loadLedger);

  const lines = cart.lines
    .map((line) => ({ ...line, item: findItem(line.itemId) }))
    .filter((line): line is CartLine & { item: MenuItem } => !!line.item);

  const yourTotal = lines.reduce((sum, line) => sum + unitPrice(line.item, line.selections) * line.qty, 0);
  const people = guests.map((guest) => ({
    ...guest,
    total: guest.isYou ? yourTotal : linesTotal(guest.order),
  }));
  const tableTotal = people.reduce((sum, person) => sum + person.total, 0);
  const remaining = Math.max(0, tableTotal - ledger.paidSubtotal);
  const partlyPaid = ledger.paidSubtotal > 0;

  // Everyone's unpaid lines, for "Pay for your items".
  const unpaid = (line: { key: string }) => !ledger.paidLineKeys.includes(line.key);
  const parties: BillParty[] = people.map((person) => ({
    id: person.id,
    name: person.name,
    isYou: person.isYou,
    lines: person.isYou
      ? lines
          .map(({ key, item, qty, selections, note }) => ({
            key,
            name: item.name,
            qty,
            total: unitPrice(item, selections) * qty,
            details: lineDetails(item, selections, note),
          }))
          .filter(unpaid)
      : person.order
          .flatMap((line, index) => {
            const item = findItem(line.itemId);
            return item
              ? [
                  {
                    key: `${person.id}-${index}`,
                    name: item.name,
                    qty: line.qty,
                    total: unitPrice(item, line.selections) * line.qty,
                    details: lineDetails(item, line.selections, line.note ?? ""),
                  },
                ]
              : [];
          })
          .filter(unpaid),
  }));

  // The table was settled but the guest left the "paid" screen another way
  // (back button, typed URL): start the next run fresh, like pressing ✕ does.
  const settledEarlier = ledger.last?.settled === true;
  useEffect(() => {
    if (!settledEarlier) return;
    cart.clear();
    resetLedger();
    setLedger(loadLedger());
  }, [settledEarlier]);

  // Once a table starts splitting, it keeps that method: the first split
  // payment's kind ("equal" or "items"); "Pay in full" can always finish it.
  const splitMethod = ledger.payments.find((p) => p.kind !== "full")?.kind as "equal" | "items" | undefined;

  // An equal split is remembered: the first one fixes how many shares the bill
  // has, later payers pick from the shares that are left.
  const equalPayments = ledger.payments.filter((p) => p.kind === "equal" && p.share);
  const equalPlan = equalPayments.length
    ? {
        people: equalPayments[0].share!.people,
        sharesPaid: equalPayments.reduce((sum, p) => sum + p.share!.payingFor, 0),
      }
    : undefined;

  return { lines, people, tableTotal, ledger, remaining, partlyPaid, parties, splitMethod, equalPlan };
}

export type TableBill = ReturnType<typeof useTableBill>;
