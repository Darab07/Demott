import { formatAmount, restaurant } from "../lib/menu";
import type { CompletedPayment } from "../lib/payment";
import { Photo } from "./Photo";

const money = (pkr: number) => `PKR ${formatAmount(pkr)}`;

export const receiptDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
export const receiptTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

// Sales tax already contained in a tax-inclusive amount.
const includedTax = (amount: number) => Math.round((amount * restaurant.salesTaxRate) / (1 + restaurant.salesTaxRate));

// When earlier equal shares already covered part of these dishes, the item
// lines add up to more than this payment's subtotal; this is the difference.
const coveredEarlier = (payment: CompletedPayment) =>
  payment.kind === "equal" ? 0 : Math.max(0, payment.items.reduce((sum, item) => sum + item.total, 0) - payment.amount);

// A paper-style itemised receipt for one payment.
export function ReceiptPaper({ payment }: { payment: CompletedPayment }) {
  const foodAfterDiscount = payment.amount - payment.discount;
  const earlier = coveredEarlier(payment);
  const tipLabel = payment.tipPercent ? `Tip (${payment.tipPercent}%)` : "Tip";

  return (
    <article
      aria-label={`Receipt ${payment.receiptNo}`}
      className="receipt-edge relative bg-white px-5 pb-9 pt-6 text-ink shadow-[0_6px_24px_rgba(0,0,0,0.08)] ring-1 ring-hairline"
    >
      {/* Restaurant */}
      <header className="flex flex-col items-center text-center">
        <div className="h-14 w-14 overflow-hidden rounded-full border border-icon-muted bg-white p-1.5">
          <Photo src={restaurant.logo} alt={`${restaurant.name} logo`} className="h-full w-full !bg-transparent" />
        </div>
        <h3 className="mt-2.5 text-lg font-bold leading-tight">{restaurant.name}</h3>
        <p className="text-[13px] font-medium text-ink-muted">{restaurant.area}</p>
        {restaurant.ntn && <p className="text-[12px] font-medium text-ink-muted">NTN {restaurant.ntn}</p>}
        <span className="mt-3 rounded-full bg-plum px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white">
          Paid
        </span>
      </header>

      <Divider />

      {/* Who, when, how */}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
        <Meta label="Receipt no." value={payment.receiptNo} />
        <Meta label="Date" value={`${receiptDate(payment.paidAt)}, ${receiptTime(payment.paidAt)}`} />
        {payment.pickup ? (
          <Meta label="Order" value={`#${payment.pickup.orderNo} · ${pickupLabel(payment.pickup.mode)}`} />
        ) : (
          <Meta label="Table" value={`#${restaurant.table} · Served by ${restaurant.server}`} />
        )}
        <Meta label="Paid by" value={payment.pickup?.name || "You"} />
        <Meta label="Method" value={payment.method} />
        <Meta label="Reference" value={payment.reference} />
      </dl>

      <Divider />

      {/* What was paid for */}
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">
        {payment.kind === "equal" ? "Your share" : "Items"}
      </p>
      {payment.kind === "equal" && payment.share ? (
        <Line
          label={`Equal share · ${payment.share.payingFor} of ${payment.share.people}`}
          sub={`Share of the table bill ${money(payment.share.tableBalance)}`}
          amount={payment.amount}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {payment.items.map((item, index) => (
            <li key={index}>
              <Line label={`${item.qty} × ${item.name}`} sub={item.details} amount={item.total} />
            </li>
          ))}
          {earlier > 0 && (
            <li>
              <Line label="Already paid earlier" sub="Covered by equal shares at this table" amount={-earlier} />
            </li>
          )}
        </ul>
      )}

      <Divider />

      {/* Totals */}
      <div className="flex flex-col gap-1.5 text-[14px]">
        <Row label="Subtotal" amount={payment.amount} />
        {payment.discount > 0 && <Row label="Promo discount" amount={-payment.discount} />}
        <Row label={tipLabel} amount={payment.tip} />
        <Row label="Instant payment fee" amount={payment.fee} />
      </div>
      <div className="my-3 h-px bg-ink" />
      <div className="flex items-baseline justify-between">
        <span className="text-base font-bold">Total paid</span>
        <span className="text-xl font-bold tabular-nums">{money(payment.total)}</span>
      </div>
      {restaurant.salesTaxRate > 0 && (
        <p className="mt-1.5 text-[12px] font-medium text-ink-muted">
          Includes sales tax ({Math.round(restaurant.salesTaxRate * 100)}%) of {money(includedTax(foodAfterDiscount))}
        </p>
      )}

      <Divider />

      {/* Where the table stands (or the order, for pickup) */}
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-ink-muted">{payment.pickup ? "Order" : "Table balance"}</span>
        <span className="font-bold">
          {payment.pickup
            ? "Paid in full"
            : payment.settled
              ? "Settled in full"
              : `${money(payment.remainingAfter)} left to pay`}
        </span>
      </div>

      <footer className="mt-6 text-center">
        <p className="text-sm font-bold">
          {payment.pickup ? "Thank you for ordering with us!" : "Thank you for dining with us!"}
        </p>
        <p className="mt-1 text-[11px] font-medium text-ink-muted">
          Computer-generated receipt · secure payments with{" "}
          <span className="font-bold tracking-[-0.03em] text-plum">tabletap.</span>
        </p>
      </footer>
    </article>
  );
}

// Plain-text version for sharing or copying.
export function receiptText(payment: CompletedPayment) {
  const pad = (label: string, value: string) => `${label}${" ".repeat(Math.max(1, 34 - label.length - value.length))}${value}`;
  const lines = [
    restaurant.name,
    restaurant.area,
    "",
    `Receipt ${payment.receiptNo}`,
    `${receiptDate(payment.paidAt)}, ${receiptTime(payment.paidAt)}`,
    payment.pickup
      ? `Order #${payment.pickup.orderNo} · ${pickupLabel(payment.pickup.mode)} · ${payment.pickup.name}`
      : `Table #${restaurant.table} · Served by ${restaurant.server}`,
    `Paid with ${payment.method} (ref ${payment.reference})`,
    "",
    ...(payment.kind === "equal" && payment.share
      ? [pad(`Equal share ${payment.share.payingFor} of ${payment.share.people}`, money(payment.amount))]
      : [
          ...payment.items.map((item) => pad(`${item.qty} x ${item.name}`, money(item.total))),
          ...(coveredEarlier(payment) ? [pad("Already paid earlier", `- ${money(coveredEarlier(payment))}`)] : []),
        ]),
    "",
    pad("Subtotal", money(payment.amount)),
    ...(payment.discount ? [pad("Promo discount", `- ${money(payment.discount)}`)] : []),
    pad(payment.tipPercent ? `Tip (${payment.tipPercent}%)` : "Tip", money(payment.tip)),
    pad("Instant payment fee", money(payment.fee)),
    pad("TOTAL PAID", money(payment.total)),
    "",
    payment.pickup
      ? "Order paid in full."
      : payment.settled
        ? "Table settled in full."
        : `${money(payment.remainingAfter)} left to pay at the table.`,
    payment.pickup ? "Thank you for ordering with us!" : "Thank you for dining with us!",
  ];
  return lines.join("\n");
}

const pickupLabel = (mode: "pickup" | "curbside") => (mode === "curbside" ? "Curbside" : "Pickup");

function Divider() {
  return <div className="my-4 border-t border-dashed border-ink/25" />;
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="font-medium text-ink-muted">{label}</dt>
      <dd className="text-right font-bold tabular-nums">{value}</dd>
    </>
  );
}

function Line({ label, sub, amount }: { label: string; sub?: string; amount: number }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[14px]">
      <div className="min-w-0">
        <p className="font-bold leading-snug">{label}</p>
        {sub && <p className="text-[12px] font-medium leading-snug text-ink-muted">{sub}</p>}
      </div>
      <span className="shrink-0 font-bold tabular-nums">
        {amount < 0 ? "− " : ""}
        {money(Math.abs(amount))}
      </span>
    </div>
  );
}

function Row({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between">
      <span className="font-medium text-ink-muted">{label}</span>
      <span className="font-bold tabular-nums">
        {amount < 0 ? "− " : ""}
        {money(Math.abs(amount))}
      </span>
    </div>
  );
}
