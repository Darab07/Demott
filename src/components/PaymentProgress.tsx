import { useState } from "react";
import { formatAmount } from "../lib/menu";
import type { TableBill } from "../lib/tableBill";
import { guests } from "../lib/table";
import { useOverlay } from "../lib/useOverlay";
import { ReceiptPaper, receiptDate, receiptTime } from "./Receipt";
import { ChevronDownIcon, ChevronRightIcon, CloseIcon } from "./icons";

// How many payments the table is expected to need: payments so far plus one
// per equal share still open, otherwise one per guest. Always at least one
// more than the payments made so far, since the table isn't settled yet.
function expectedPayments(bill: TableBill) {
  const done = bill.ledger.payments.length;
  if (bill.equalPlan) return done + Math.max(1, bill.equalPlan.people - bill.equalPlan.sharesPaid);
  return Math.max(guests.length, done + 1);
}

// "Payment progress" card shown on the menu once a split payment has been
// made and the table still has a balance.
export function PaymentProgressCard({
  bill,
  onViewDetails,
  onDismiss,
}: {
  bill: TableBill;
  onViewDetails: () => void;
  onDismiss: () => void;
}) {
  const done = bill.ledger.payments.length;
  const total = expectedPayments(bill);

  return (
    <section
      aria-label="Payment progress"
      className="flex animate-toast-in flex-col gap-5 rounded-[26px] bg-white px-[17px] py-[18px] ring-1 ring-inset ring-[#dbdbdb] motion-reduce:animate-none"
    >
      <div className="flex gap-2" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < done ? "bg-plum" : "bg-[#d9d9d9]"}`} />
        ))}
      </div>
      <div className="flex flex-col gap-3.5">
        <div className="flex items-baseline justify-between gap-3 text-sm font-bold leading-none">
          <span className="whitespace-nowrap">Payment progress</span>
          <span className="whitespace-nowrap text-right">
            PKR {formatAmount(bill.ledger.paidSubtotal)} of {formatAmount(bill.tableTotal)} paid
          </span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-3.5">
            <p className="text-sm font-bold leading-none text-[#888]">
              {done} of {total} payments complete
            </p>
            <button
              type="button"
              onClick={onViewDetails}
              className="flex items-center gap-0.5 text-left text-sm font-bold leading-none"
            >
              View payment details
              <ChevronRightIcon className="h-3 w-3" strokeWidth={2.4} />
            </button>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full px-[11px] py-2 text-sm font-bold leading-none text-[#888] ring-1 ring-inset ring-[#d9d9d9]"
          >
            Dismiss
          </button>
        </div>
      </div>
    </section>
  );
}

// Every payment made at the table so far, each opening its full receipt.
export function PaymentDetailsSheet({ open, onClose, bill }: { open: boolean; onClose: () => void; bill: TableBill }) {
  useOverlay(open, onClose);
  const [expanded, setExpanded] = useState<string | null>(null);
  const payments = bill.ledger.payments;

  return (
    <div
      className={`fixed inset-0 z-50 mx-auto max-w-phone transition-[visibility] duration-300 ${
        open ? "visible" : "invisible"
      }`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Payment details"
        className={`absolute inset-x-0 bottom-0 max-h-[calc(100dvh-60px)] overflow-y-auto overscroll-contain rounded-t-[23px] bg-cream px-[17px] pb-[calc(env(safe-area-inset-bottom)+110px)] pt-4 transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <header className="grid grid-cols-[40px_1fr_40px] items-center">
          <span />
          <h2 className="text-center text-xl font-bold leading-none text-black">Payment details</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center">
            <CloseIcon className="h-6 w-6" strokeWidth={2} />
          </button>
        </header>

        <div className="mt-5 flex flex-col gap-2 rounded-[19px] bg-white p-4 text-[15px] ring-1 ring-inset ring-hairline">
          <SummaryRow label="Table total" value={bill.tableTotal} />
          <SummaryRow label="Paid so far" value={bill.ledger.paidSubtotal} />
          <div className="h-px bg-hairline" />
          <SummaryRow label="Left to pay" value={bill.remaining} bold />
        </div>

        <ul className="mt-4 flex flex-col gap-2.5">
          {payments.map((payment, index) => {
            const isOpen = expanded === payment.receiptNo;
            return (
              <li key={payment.receiptNo} className="overflow-hidden rounded-[19px] bg-white ring-1 ring-inset ring-hairline">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : payment.receiptNo)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="flex flex-col gap-1">
                    <span className="text-[15px] font-bold leading-none">
                      Payment {index + 1} · {payment.kind === "equal" ? "Equal share" : payment.kind === "items" ? "By items" : "In full"}
                    </span>
                    <span className="text-[13px] font-medium text-ink-muted">
                      {receiptDate(payment.paidAt)}, {receiptTime(payment.paidAt)} · {payment.method}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-[15px] font-bold">
                    PKR {formatAmount(payment.total)}
                    <ChevronDownIcon
                      className={`h-5 w-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      strokeWidth={2}
                    />
                  </span>
                </button>
                {isOpen && (
                  <div className="animate-step-in px-2 pb-3 motion-reduce:animate-none">
                    <ReceiptPaper payment={payment} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "font-bold" : "font-medium text-ink-muted"}>{label}</span>
      <span className="font-bold tabular-nums">PKR {formatAmount(value)}</span>
    </div>
  );
}
