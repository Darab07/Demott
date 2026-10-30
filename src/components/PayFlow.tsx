import { useLocation } from "wouter";
import { savePayment } from "../lib/payment";
import type { TableBill } from "../lib/tableBill";
import { PayBillSheet } from "./PayBillSheet";

// The "Pay your bill" sheet wired to the table's remaining balance; choosing
// how to pay carries on to the tip screen. Used by the order page and by the
// menu once a split payment has locked the order.
export function PayFlow({ open, onClose, bill }: { open: boolean; onClose: () => void; bill: TableBill }) {
  const [, navigate] = useLocation();
  return (
    <PayBillSheet
      open={open}
      amount={bill.remaining}
      tableTotal={bill.tableTotal}
      parties={bill.parties}
      splitMethod={bill.splitMethod}
      equalPlan={bill.equalPlan}
      onClose={onClose}
      onPay={(amount, kind, detail) => {
        // What this payment covers, for the receipt: everything left (in
        // full), the ticked dishes (by item), or none (an equal share).
        const unpaidLines = bill.parties.flatMap((party) => party.lines);
        const covered =
          kind === "full"
            ? unpaidLines
            : kind === "items"
              ? unpaidLines.filter((line) => detail?.lineKeys?.includes(line.key))
              : [];
        savePayment({
          amount,
          kind,
          remaining: bill.remaining,
          lineKeys: detail?.lineKeys,
          share: detail?.share,
          items: covered.map(({ name, qty, total, details }) => ({ name, qty, total, details })),
        });
        navigate("/tip");
      }}
    />
  );
}
