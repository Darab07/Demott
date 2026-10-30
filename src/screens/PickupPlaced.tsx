import { useEffect, useState, type ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { modeIcon } from "../components/PickupModePicker";
import { CloseIcon, ShieldCheckIcon, WalletIcon } from "../components/icons";
import { formatAmount, restaurant } from "../lib/menu";
import { loadPickupOrder, READY_IN } from "../lib/pickup";
import { BROWSER_BAR_CLEARANCE } from "./Paid";

// After paying for a Curbside / Pickup order: the order number, how it'll be
// collected and what was paid. "Track order" opens the live tracking page
// (with, for curbside, the "I'm here" button).
export function PickupPlaced() {
  const [, navigate] = useLocation();
  const [order] = useState(loadPickupOrder);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!order) return <Redirect to="/" />;

  const curbside = order.mode === "curbside";
  const payment = order.payment;

  // Back to the menu; the order stays, tracked from the card there.
  const close = () => navigate("/");

  return (
    <main className={`mx-auto flex min-h-[100dvh] max-w-phone flex-col ${BROWSER_BAR_CLEARANCE}`}>
      <header className="flex justify-end px-5 pt-[calc(env(safe-area-inset-top)+22px)]">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-inset ring-hairline"
        >
          <CloseIcon className="h-5 w-5" strokeWidth={2} />
        </button>
      </header>

      <div className="mt-[22px] flex flex-col gap-[22px] px-5">
        <div className="flex flex-col gap-3">
          <h1 className="text-[30px] font-bold leading-[1.2]">
            Order placed.
            <br />
            We’re on it.
          </h1>
          <p className="text-base font-medium leading-[1.375] text-ink-muted">
            {curbside
              ? "Once you’ve parked, tap “I’m here” on your order and we’ll bring it out."
              : "We’ll let you know when it’s ready. Show your order number at the counter to collect it."}
          </p>
        </div>

        {/* Order number | ready time */}
        <section className="flex items-center rounded-3xl bg-white ring-1 ring-inset ring-hairline">
          <Stat value={order.orderNo} label="Order number" />
          <span className="h-10 w-px bg-hairline" />
          <Stat value={READY_IN} label="Ready in about" />
        </section>

        {/* How it's collected, and what was paid */}
        <section className="flex flex-col rounded-3xl bg-white ring-1 ring-inset ring-hairline">
          <InfoRow
            icon={modeIcon(order.mode, "h-5 w-5")}
            title={curbside ? `Curbside · ${order.car?.plate.toUpperCase() || "your car"}` : "Pickup · at the counter"}
            detail={
              curbside
                ? [order.car?.model.trim(), order.car?.spot?.trim()].filter(Boolean).join(" · ")
                : `Collect from ${restaurant.name}, ${restaurant.area}`
            }
          />
          <span className="mx-4 h-px bg-ink/10" />
          <InfoRow
            icon={<WalletIcon className="h-5 w-5" />}
            title={`Paid · ${payment.method}`}
            detail={`PKR ${formatAmount(payment.total)} paid online`}
            badge="Paid"
          />
        </section>

        <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink-muted">
          <ShieldCheckIcon className="h-4 w-4 shrink-0 text-[#2E7D4F]" strokeWidth={1.6} />
          Your details are saved on this device for next time.
        </p>
      </div>

      <div className="mt-auto flex flex-col items-center gap-[18px] px-5 pt-10">
        <button
          type="button"
          onClick={() => navigate(`/track/${order.orderNo}`)}
          className="relative w-full rounded-full bg-black py-5 text-lg font-medium leading-none text-white transition active:scale-[0.98]"
        >
          Track order
          {curbside && !order.arrivedAt && (
            <span className="absolute right-6 top-1/2 h-2.5 w-2.5 -translate-y-1/2 animate-pulse rounded-full bg-white" />
          )}
        </button>
        <button type="button" onClick={close} className="text-[17px] font-semibold underline underline-offset-4">
          Back to menu
        </button>
      </div>

    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 px-2.5 py-5">
      <span className="whitespace-nowrap text-2xl font-bold leading-none">{value}</span>
      <span className="text-sm font-medium text-ink-muted">{label}</span>
    </div>
  );
}

export function InfoRow({ icon, title, detail, badge }: { icon: ReactNode; title: string; detail: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3.5 p-4">
      <span className="flex shrink-0 items-center justify-center rounded-[14px] bg-plum/[0.08] p-2.5 text-plum">{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="text-base font-bold leading-tight">{title}</span>
        {detail && <span className="text-sm font-medium leading-tight text-ink-muted">{detail}</span>}
      </div>
      {badge && (
        <span className="shrink-0 rounded-xl bg-plum/10 px-2.5 py-[5px] text-xs font-bold uppercase tracking-[0.04em] text-plum">
          {badge}
        </span>
      )}
    </div>
  );
}
