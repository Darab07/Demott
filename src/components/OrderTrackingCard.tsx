import { useRef, type ReactNode } from "react";
import { READY_IN, stepLabels, useOrderProgress, type PickupOrder } from "../lib/pickup";
import { modeIcon } from "./PickupModePicker";
import { ChevronRightIcon } from "./icons";

const STAGGER_MS = 140; // between segments filling in when the card appears
const READY_WITHIN_MS = 20 * 60_000; // upper end of READY_IN

const time = (ms: number) =>
  new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

// Live order card on the Curbside / Pickup menu once an order is placed: where
// it's at, when it'll be ready, what to do next, and a link to full tracking.
export function OrderTrackingCard({
  order,
  onViewDetails,
  onDismiss,
  pager,
}: {
  order: PickupOrder;
  onViewDetails: () => void;
  onDismiss: () => void;
  pager?: ReactNode; // dots to the other active orders, between the two buttons
}) {
  const { times, current, finished, onItsWay, ready, status } = useOrderProgress(order);
  const labels = stepLabels[order.mode];
  const curbside = order.mode === "curbside";
  const plate = order.car?.plate.toUpperCase();

  // Segments reached when the card first shows fill in one after another;
  // a step finished later fills straight away.
  const firstStep = useRef(current);
  const delay = (i: number) => `${i <= firstStep.current ? i * STAGGER_MS : 0}ms`;

  const headline = finished
    ? "Delivered to your car"
    : onItsWay
      ? "On its way to your car"
      : ready
        ? "Ready to collect"
        : current === 0
          ? "Order placed"
          : current === 1
            ? "Order accepted"
            : "Preparing your order";
  const eta = finished
    ? `at ${time(times[4])}`
    : onItsWay
      ? "Coming out now"
      : ready
        ? "At the counter"
        : `Ready by ${time(Date.parse(order.payment.paidAt) + READY_WITHIN_MS)}`;
  const hint = finished
    ? "Enjoy your meal!"
    : onItsWay
      ? plate
        ? `The team is bringing it out to ${plate}`
        : "The team is bringing it out to you"
      : ready
        ? null
        : curbside
          ? order.arrivedAt
            ? "You’re checked in. We’ll bring it out when it’s ready"
            : "Tap “I’m here” in order details once you’ve parked"
          : `Usually ${READY_IN}. We’ll have it at the counter`;

  return (
    <section
      aria-label={`Order ${order.orderNo}: ${status}`}
      className="flex animate-toast-in flex-col gap-4 rounded-[26px] bg-white px-[17px] py-[18px] ring-1 ring-inset ring-[#dbdbdb] motion-reduce:animate-none"
    >
      <div className="flex gap-2" aria-hidden="true">
        {labels.map((label, i) => {
          const done = i < current || (finished && i === current);
          const live = i === current && !done;
          return (
            <span key={label} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#d9d9d9]">
              {done && (
                <span
                  className="absolute inset-0 origin-left animate-bar-fill rounded-full bg-[#013630] motion-reduce:animate-none"
                  style={{ animationDelay: delay(i) }}
                />
              )}
              {live && (
                <span
                  className="absolute inset-0 origin-left animate-bar-live rounded-full bg-[#013630] motion-reduce:animate-none motion-reduce:opacity-50"
                  style={{ animationDelay: delay(i), animationFillMode: "backwards" }}
                />
              )}
            </span>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5" aria-live="polite">
        <div className="flex items-baseline justify-between gap-3 leading-tight">
          <span className="text-base font-bold">{headline}</span>
          <span className="shrink-0 text-sm font-bold">{eta}</span>
        </div>
        <p className="flex items-center gap-1.5 text-[13px] font-bold leading-tight text-[#888]">
          {modeIcon(order.mode, "h-3.5 w-3.5 shrink-0")}
          {order.orderNo} · {curbside ? "Curbside" : "Pickup"} · Step {current + 1} of {labels.length}
        </p>
      </div>

      {hint && (
        <p className="flex items-start gap-2 rounded-2xl bg-cream px-3 py-2.5 text-[13px] font-medium leading-snug text-ink">
          <span
            className={`mt-[5px] h-2 w-2 shrink-0 rounded-full ${
              finished ? "bg-ink/30" : "animate-pulse bg-[#2E7D4F] motion-reduce:animate-none"
            }`}
          />
          {hint}
        </p>
      )}

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <button
          type="button"
          onClick={onViewDetails}
          className="flex items-center gap-0.5 justify-self-start whitespace-nowrap text-left text-sm font-bold leading-none"
        >
          View order details
          <ChevronRightIcon className="h-3 w-3" strokeWidth={2.4} />
        </button>
        {pager ?? <span />}
        <button
          type="button"
          onClick={onDismiss}
          className="justify-self-end rounded-full px-[11px] py-2 text-sm font-bold leading-none text-[#888] ring-1 ring-inset ring-[#d9d9d9]"
        >
          Dismiss
        </button>
      </div>
    </section>
  );
}

// Several orders in progress: one card at a time, swiped or picked with the
// dots inside each card. Newest first.
export function ActiveOrders({
  orders,
  onViewDetails,
  onDismiss,
}: {
  orders: PickupOrder[];
  onViewDetails: (order: PickupOrder) => void;
  onDismiss: (order: PickupOrder) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const goTo = (index: number) => {
    const scroller = scrollerRef.current;
    scroller?.scrollTo({ left: index * scroller.clientWidth, behavior: "smooth" });
  };

  if (orders.length === 1) {
    const order = orders[0];
    return (
      <OrderTrackingCard order={order} onViewDetails={() => onViewDetails(order)} onDismiss={() => onDismiss(order)} />
    );
  }

  return (
    <section aria-roledescription="carousel" aria-label="Your active orders">
      <div
        ref={scrollerRef}
        className="-mx-[17px] flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {orders.map((order, page) => (
          <div
            key={order.orderNo}
            role="group"
            aria-roledescription="slide"
            aria-label={`Order ${page + 1} of ${orders.length}`}
            className="w-full shrink-0 snap-center px-[17px]"
          >
            <OrderTrackingCard
              order={order}
              onViewDetails={() => onViewDetails(order)}
              onDismiss={() => onDismiss(order)}
              pager={
                <div className="flex items-center gap-1" aria-label={`Order ${page + 1} of ${orders.length}`}>
                  {orders.map((other, i) => (
                    <button
                      key={other.orderNo}
                      type="button"
                      onClick={() => goTo(i)}
                      disabled={i === page}
                      aria-label={`Show order ${other.orderNo}`}
                      aria-current={i === page}
                      className="flex h-6 items-center justify-center px-0.5"
                    >
                      <span
                        className={`block h-1.5 rounded-full ${i === page ? "w-5 bg-[#013630]" : "w-1.5 bg-[#d9d9d9]"}`}
                      />
                    </button>
                  ))}
                </div>
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}
