import { useCallback, useEffect, useState } from "react";
import { Redirect, useLocation, useParams } from "wouter";
import { modeIcon } from "../components/PickupModePicker";
import { CheckIcon, CloseIcon, MapPinIcon, PhoneIcon, ReceiptIcon, WalletIcon } from "../components/icons";
import { tapFeedback } from "../lib/haptics";
import { formatAmount, restaurant } from "../lib/menu";
import { loadPickupOrder, READY_IN, savePickupOrder, stepLabels, useOrderProgress } from "../lib/pickup";
import { BROWSER_BAR_CLEARANCE, ReceiptSheet } from "./Paid";
import { InfoRow } from "./PickupPlaced";

const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${restaurant.name} ${restaurant.area}`,
)}`;

const time = (ms: number) => new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

// Live order tracking for Curbside / Pickup: where the order is at, "I'm here"
// for curbside, the payment and receipt, and where to park or collect.
export function PickupTrack() {
  const [, navigate] = useLocation();
  const { orderNo } = useParams<{ orderNo: string }>();
  const [order, setOrder] = useState(() => loadPickupOrder(orderNo));
  const [receiptOpen, setReceiptOpen] = useState(false);
  const closeReceipt = useCallback(() => setReceiptOpen(false), []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { times, current, finished, onItsWay, ready, status } = useOrderProgress(order);

  if (!order) return <Redirect to="/" />;

  const curbside = order.mode === "curbside";
  const labels = stepLabels[order.mode];
  const arrived = !!order.arrivedAt;

  // Close: back to the menu, where the order is still tracked from its card.
  const close = () => navigate("/");

  const arrive = () => {
    tapFeedback([15, 60, 15]);
    const next = { ...order, arrivedAt: new Date().toISOString() };
    savePickupOrder(next);
    setOrder(next);
  };

  const headline = finished
    ? ["Enjoy your", "meal!"]
    : onItsWay
      ? ["Your order is", "on its way out."]
      : ready
        ? ["Your order is", "ready to collect."]
        : ["Your order is", "being made."];
  const subtitle = finished
    ? `Delivered to your car. Thanks for ordering from ${restaurant.name}!`
    : onItsWay
      ? "The team is bringing it out to your car now."
      : ready
        ? `Head to the counter and show order number ${order.orderNo}.`
        : curbside
          ? arrived
            ? "You’re checked in. We’ll bring it out as soon as it’s ready."
            : "Head over whenever you’re ready. Tap “I’m here” once you’ve parked."
          : `We’ll have it ready at the counter in about ${READY_IN}.`;
  const live = finished
    ? `Delivered at ${time(times[4])}`
    : onItsWay
      ? "Live · coming out to you now"
      : ready
        ? "Live · waiting at the counter"
        : `Live · usually ${READY_IN}`;

  return (
    <main className={`mx-auto min-h-[100dvh] max-w-phone ${BROWSER_BAR_CLEARANCE}`}>
      <header className="flex items-center gap-3 px-5 pt-[calc(env(safe-area-inset-top)+22px)]">
        <button
          type="button"
          onClick={close}
          aria-label="Close tracking"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-hairline"
        >
          <CloseIcon className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h1 className="text-lg font-bold leading-tight">Order {order.orderNo}</h1>
          <p className="truncate text-[13px] font-medium text-ink-muted">
            {restaurant.name} · {restaurant.area}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-semibold leading-none ring-1 ring-inset ring-hairline">
          {modeIcon(order.mode, "h-4 w-4")}
          {curbside ? "Curbside" : "Pickup"}
        </span>
      </header>

      <div className="mt-5 flex flex-col gap-6 px-5">
        <div className="flex flex-col gap-2.5" aria-live="polite">
          <h2 className="text-[30px] font-bold leading-[1.2]">
            {headline[0]}
            <br />
            {headline[1]}
          </h2>
          <p className="text-base font-medium leading-[1.375] text-ink-muted">{subtitle}</p>
        </div>

        {/* Stage bar */}
        <section className="flex flex-col gap-3.5 rounded-[26px] bg-white p-[18px] ring-1 ring-inset ring-[#dbdbdb]">
          <div className="flex gap-1.5">
            {labels.map((label, i) => (
              <span
                key={label}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                  i <= current ? "bg-[#013630]" : "bg-[#d9d9d9]"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[17px] font-bold">{status}</span>
            <span className="text-[15px] font-medium text-ink-muted">
              Step {current + 1} of {labels.length}
            </span>
          </div>
          <p className="flex items-center gap-2 text-sm font-medium text-ink-muted">
            <span
              className={`h-2 w-2 rounded-full ${finished ? "bg-ink/30" : "animate-pulse bg-[#2E7D4F] motion-reduce:animate-none"}`}
            />
            {live}
          </p>
        </section>

        {/* Curbside check-in, or the number to show at the counter */}
        {curbside ? (
          !finished && (
            <section data-tour="checkin" className="flex flex-col gap-3.5 rounded-[26px] bg-plum p-5 text-white">
              {arrived ? (
                <>
                  <h3 className="flex items-center gap-2 text-[19px] font-bold">
                    <CheckIcon className="h-5 w-5" strokeWidth={2.4} />
                    You’re checked in
                  </h3>
                  <p className="text-[15px] font-medium leading-[1.4] text-white/75">
                    The team knows you’re here
                    {order.car?.plate ? ` and will look for ${order.car.plate.toUpperCase()}` : ""}
                    {order.car?.spot?.trim() ? ` ${order.car.spot.trim()}` : ""}.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-[19px] font-bold">Parked outside?</h3>
                  <p className="text-[15px] font-medium leading-[1.4] text-white/75">
                    Tap “I’m here” and the team will bring your order out to your car.
                  </p>
                  <button
                    type="button"
                    onClick={arrive}
                    className="flex w-full items-center justify-center gap-2.5 rounded-full bg-white py-[18px] text-lg font-bold leading-none text-black transition active:scale-[0.98]"
                  >
                    {modeIcon("curbside", "h-5 w-5")}
                    I’m here
                  </button>
                </>
              )}
            </section>
          )
        ) : (
          <section className="flex flex-col gap-3.5 rounded-[26px] bg-plum p-5 text-white">
            <h3 className="text-[19px] font-bold">{ready ? "It’s ready!" : "Collecting at the counter"}</h3>
            <p className="text-[15px] font-medium leading-[1.4] text-white/75">
              Show this order number to the team at the counter.
            </p>
            <p className="rounded-full bg-white py-[14px] text-center text-2xl font-bold leading-none tracking-[0.02em] text-black">
              {order.orderNo}
            </p>
          </section>
        )}

        {/* Progress */}
        <section className="flex flex-col gap-4">
          <h3 className="text-lg font-medium leading-none">Progress</h3>
          <ol className="flex flex-col gap-4">
            {labels.map((label, i) => {
              const done = i < current || (finished && i === current);
              const isNow = i === current && !done;
              return (
                <li key={label} className="flex items-center gap-3.5">
                  {done ? (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#013630] text-white">
                      <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </span>
                  ) : isNow ? (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2 ring-inset ring-plum">
                      <span className="h-3 w-3 rounded-full bg-plum" />
                    </span>
                  ) : (
                    <span className="h-6 w-6 shrink-0 rounded-full ring-2 ring-inset ring-[#d9d9d9]" />
                  )}
                  <span
                    className={`flex-1 text-base ${isNow ? "font-bold" : "font-medium"} ${
                      done || isNow ? "" : "text-ink/40"
                    }`}
                  >
                    {label}
                  </span>
                  {done && <span className="text-sm font-medium text-ink/50">{time(times[i])}</span>}
                  {isNow && (
                    <span className="rounded-xl bg-plum/10 px-2.5 py-[5px] text-xs font-bold uppercase tracking-[0.04em] text-plum">
                      Now
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <section className="rounded-3xl bg-white ring-1 ring-inset ring-hairline">
          <InfoRow
            icon={<WalletIcon className="h-5 w-5" />}
            title={`Paid · ${order.payment.method}`}
            detail={`PKR ${formatAmount(order.payment.total)} paid online`}
            badge="Paid"
          />
        </section>

        <button
          type="button"
          onClick={() => setReceiptOpen(true)}
          className="flex w-full items-center justify-center gap-2.5 rounded-full bg-black py-5 text-lg font-medium leading-none text-white transition active:scale-[0.98]"
        >
          <ReceiptIcon className="h-5 w-5 text-white" />
          Get my receipt
        </button>

        {/* Where to park / collect */}
        <section className="flex flex-col gap-3.5">
          <h3 className="text-lg font-medium leading-none">{curbside ? "Where to park" : "Where to collect"}</h3>
          <MapPreview />
          <div className="flex items-center gap-3">
            <span className="flex shrink-0 items-center justify-center rounded-[14px] bg-plum/[0.08] p-2.5 text-plum">
              <MapPinIcon className="h-5 w-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="text-base font-bold leading-tight">{restaurant.name}</span>
              <span className="text-sm font-medium leading-tight text-ink-muted">
                {restaurant.area} · {curbside ? "park outside the entrance" : "counter inside the entrance"}
              </span>
            </div>
          </div>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noreferrer"
            className="w-full rounded-full bg-white py-[18px] text-center text-[17px] font-semibold leading-none ring-[1.5px] ring-inset ring-ink/20 transition active:scale-[0.98]"
          >
            Open in Google Maps
          </a>
        </section>

        <a
          href={`tel:${restaurant.phone.replace(/\s/g, "")}`}
          className="flex items-center gap-2 self-start text-base font-semibold text-plum"
        >
          <PhoneIcon className="h-[18px] w-[18px]" strokeWidth={1.5} />
          Need help? Call {restaurant.name}
        </a>

        <p className="flex items-center gap-[5px] text-sm font-medium text-ink-muted">
          Powered by
          <span className="text-[15px] font-bold tracking-[-0.03em] text-plum">tabletap.</span>
        </p>
      </div>

      <ReceiptSheet open={receiptOpen} payment={order.payment} onClose={closeReceipt} />
    </main>
  );
}

// Simple drawn map of the restaurant's block (decorative).
function MapPreview() {
  return (
    <div aria-hidden="true" className="relative h-[170px] overflow-hidden rounded-3xl bg-[#ECE7DC]">
      <span className="absolute left-[-10px] top-[105px] h-[70px] w-[120px] rounded-xl bg-[#D5E5C9]" />
      <span className="absolute left-[-40px] top-[60px] h-4 w-[460px] origin-top-left rotate-[12deg] bg-white" />
      <span className="absolute left-1/2 top-[-40px] h-[260px] w-4 origin-top-left rotate-[8deg] bg-white" />
      <span className="absolute left-[-40px] top-[140px] h-2.5 w-[460px] origin-top-left -rotate-6 bg-white" />
      <span className="absolute left-1/2 top-[74px] h-14 w-14 -translate-x-1/2 rounded-full bg-plum/15" />
      <span className="absolute left-1/2 top-[92px] h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-white bg-plum" />
      <span className="absolute left-1/2 top-10 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-2xl bg-white px-3 py-[7px] text-[13px] font-bold shadow-[0_3px_10px_rgba(0,0,0,0.12)]">
        <MapPinIcon className="h-3.5 w-3.5 text-plum" />
        {restaurant.name}
      </span>
    </div>
  );
}
