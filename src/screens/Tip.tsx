import { useCallback, useEffect, useState } from "react";
import { Redirect, useLocation } from "wouter";
import { CheckIcon, ChevronLeftIcon } from "../components/icons";
import { tapFeedback } from "../lib/haptics";
import { formatAmount, restaurant } from "../lib/menu";
import { loadPayment, savePayment } from "../lib/payment";
import { useOverlay } from "../lib/useOverlay";

const presets = [
  { percent: 20, emoji: "😊" },
  { percent: 23, emoji: "😘" },
  { percent: 25, emoji: "❤️", popular: true },
];

// A preset percentage, or a custom amount in PKR (0 = no tip).
type TipChoice = { percent: number } | { custom: number };

export function Tip() {
  const [, navigate] = useLocation();
  const [payment] = useState(loadPayment);
  // Back from checkout: reopen on the tip already chosen.
  const [choice, setChoice] = useState<TipChoice>(() =>
    payment?.tip === undefined
      ? { percent: 25 }
      : payment.tipPercent
        ? { percent: payment.tipPercent }
        : { custom: payment.tip },
  );
  const [customOpen, setCustomOpen] = useState(false);
  const closeCustom = useCallback(() => setCustomOpen(false), []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Landed here without choosing what to pay (e.g. a fresh tab): start over.
  if (!payment) return <Redirect to="/" />;

  const base = payment.amount;
  const tip = "percent" in choice ? Math.round((base * choice.percent) / 100) : choice.custom;
  const noTip = "custom" in choice && choice.custom === 0;
  const customTip = "custom" in choice && choice.custom > 0 ? choice.custom : null;

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-phone flex-col pb-[calc(env(safe-area-inset-bottom)+190px)]">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center px-5 pt-[calc(env(safe-area-inset-top)+22px)]">
        <button
          type="button"
          aria-label="Back to your order"
          onClick={() => navigate("/order")}
          className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-inset ring-hairline"
        >
          <ChevronLeftIcon className="h-5 w-5" strokeWidth={2} />
        </button>
        <h1 className="text-center text-2xl font-medium leading-none">Tip</h1>
        <button
          type="button"
          onClick={() => setCustomOpen(true)}
          className={`justify-self-end text-base font-medium underline underline-offset-2 ${
            customTip ? "text-black" : "text-[#727272]"
          }`}
        >
          {customTip ? `Custom: PKR ${formatAmount(customTip)}` : "Custom Tip"}
        </button>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-7 px-[11px] py-10">
        <h2 className="text-center text-[38px] font-bold leading-[1.05] text-black">
          Say thanks to
          <br />
          {restaurant.server}
          <br />
          with a tip
        </h2>

        <div className="grid w-full grid-cols-3 gap-3.5 pb-6" role="radiogroup" aria-label="Tip amount">
          {presets.map((preset) => {
            const selected = "percent" in choice && choice.percent === preset.percent;
            return (
              <button
                key={preset.percent}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  tapFeedback();
                  setChoice({ percent: preset.percent });
                }}
                className="relative transition active:scale-[0.97]"
              >
                <span
                  className={`flex aspect-square w-full items-center justify-center gap-[5px] rounded-[28px] text-[18.5px] transition-colors ${
                    selected
                      ? "bg-[#eaecef] font-bold ring-[1.75px] ring-inset ring-black"
                      : "bg-white font-medium ring-[1.15px] ring-inset ring-[#e1e3ea]"
                  }`}
                >
                  {selected && (
                    <span className="flex h-[18.5px] w-[18.5px] items-center justify-center rounded-full bg-black text-white">
                      <CheckIcon className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                  {preset.percent}%
                </span>
                {preset.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-[7px] bg-black px-[9px] py-0.5 text-[10.4px] font-black tracking-[0.02em] text-white">
                    POPULAR
                  </span>
                )}
                <span aria-hidden="true" className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[37px] leading-none">
                  {preset.emoji}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-pressed={noTip}
          onClick={() => {
            tapFeedback();
            setChoice({ custom: 0 });
          }}
          className={`-mt-1 text-base font-medium underline underline-offset-2 transition-colors ${
            noTip ? "font-bold text-black" : "text-[#727272]"
          }`}
        >
          No Tip
        </button>
      </section>

      <footer className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-phone border-t border-[#e1e3ea] bg-white px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-6 shadow-[0_-10px_20px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col items-center gap-1.5 text-center" aria-live="polite">
          <p className="text-[15px] font-medium text-[#727272]">
            {tip > 0 ? `Tip amount: PKR ${formatAmount(tip)}` : "No tip"}
          </p>
          <p className="text-lg font-bold text-black">You're paying: PKR {formatAmount(base + tip)}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            savePayment({ ...payment, tip, tipPercent: "percent" in choice ? choice.percent : null });
            navigate("/checkout");
          }}
          className="mt-4 h-[54px] w-full rounded-full bg-black text-base font-bold text-white transition active:scale-[0.98]"
        >
          Confirm
        </button>
      </footer>

      <CustomTipSheet
        open={customOpen}
        initial={tip}
        onClose={closeCustom}
        onSave={(amount) => {
          setChoice({ custom: amount });
          setCustomOpen(false);
        }}
      />
    </main>
  );
}

function CustomTipSheet({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: number;
  onClose: () => void;
  onSave: (amount: number) => void;
}) {
  useOverlay(open, onClose);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue(initial > 0 ? String(initial) : "");
  }, [open, initial]);

  const amount = Math.max(0, Math.round(Number(value) || 0));

  return (
    <div
      className={`fixed inset-0 z-50 mx-auto max-w-phone transition-[visibility] duration-300 ${
        open ? "visible" : "invisible"
      }`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Custom tip"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(amount);
        }}
        className={`absolute inset-x-0 bottom-0 rounded-t-[23px] bg-white px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-6 transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <h2 className="text-center text-xl font-bold">Custom tip</h2>
        <label className="mt-5 flex items-center gap-2 rounded-2xl bg-cream px-4 py-3.5 ring-1 ring-inset ring-hairline focus-within:ring-ink/40">
          <span className="text-base font-bold text-[#727272]">PKR</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            aria-label="Tip amount in PKR"
            className="w-full bg-transparent text-base font-bold outline-none placeholder:text-ink/30"
          />
        </label>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => onSave(0)}
            className="h-[54px] flex-1 rounded-full bg-[#e7e7e8] text-base font-bold text-black transition active:scale-[0.98]"
          >
            No tip
          </button>
          <button
            type="submit"
            className="h-[54px] flex-1 rounded-full bg-black text-base font-bold text-white transition active:scale-[0.98]"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
