import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { formatAmount } from "../lib/menu";
import type { EqualShare, PaymentKind } from "../lib/payment";
import { guests } from "../lib/table";
import { useOverlay } from "../lib/useOverlay";
import { CheckIcon, ChevronLeftIcon, CloseIcon, ListIcon, MinusIcon, PieChartIcon, PlusIcon } from "./icons";

// One person at the table and their order lines, for "Pay for your items".
export type BillParty = {
  id: string;
  name: string;
  isYou?: boolean;
  lines: { key: string; name: string; qty: number; total: number; details?: string }[];
};

type Step = "how" | "split" | "equal" | "items" | "left";

const steps: Record<Step, { title: string; parent?: Step }> = {
  how: { title: "Pay your bill" },
  split: { title: "Pay your bill", parent: "how" },
  equal: { title: "Divide the bill equally", parent: "split" },
  items: { title: "Pay for your items", parent: "split" },
  // A table that is already splitting equally: pick shares of what's left.
  left: { title: "Divide the bill equally", parent: "how" },
};

const MIN_PEOPLE = 2;
const MAX_PEOPLE = 20;

// "Pay your bill" sheet from the order page. Step one picks split vs. full;
// splitting picks by-item vs. equal shares. Equal shares picks how many
// people's worth of `amount` (the table total) this guest covers; by-item
// picks dishes from everyone's `parties`.
export function PayBillSheet({
  open,
  amount,
  tableTotal,
  parties,
  splitMethod,
  equalPlan,
  onClose,
  onPay,
}: {
  open: boolean;
  amount: number; // what's left to pay
  tableTotal: number; // the whole bill
  parties: BillParty[];
  splitMethod?: "equal" | "items"; // set once the table has started splitting
  equalPlan?: EqualPlan; // set once someone has paid an equal share
  onClose: () => void;
  // Continue to the tip screen. `lineKeys` for by-item payments, `share` for equal ones.
  onPay: (amount: number, kind: PaymentKind, detail?: { lineKeys?: string[]; share?: EqualShare }) => void;
}) {
  useOverlay(open, onClose);
  const [step, setStep] = useState<Step>("how");
  const [forward, setForward] = useState(true); // which side the next step slides in from

  // Always start at the first step when reopened.
  useEffect(() => {
    if (open) setStep("how");
  }, [open]);

  const goTo = (next: Step) => {
    setForward(true);
    setStep(next);
  };
  const backTo = (target: Step) => {
    setForward(false);
    setStep(target);
  };
  const back = () => {
    const parent = steps[step].parent;
    if (!parent) return onClose();
    // Once the table has a split method the choice step is skipped, so its
    // screens go straight back to the first step.
    backTo(splitMethod && parent === "split" ? "how" : parent);
  };

  // "Split the bill": straight to the table's method once it has one.
  const splitTheBill = () => {
    if (splitMethod === "equal") {
      goTo("left");
    } else if (splitMethod === "items") {
      goTo("items");
    } else {
      goTo("split");
    }
  };

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
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-bill-title"
        className={`absolute inset-x-0 bottom-0 flex max-h-[calc(100dvh-84px)] flex-col rounded-t-[23px] bg-white px-[17px] pb-[calc(env(safe-area-inset-bottom)+32px)] pt-4 transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <header className="grid grid-cols-[40px_1fr_40px] items-center">
          <button
            type="button"
            onClick={back}
            aria-label={steps[step].parent ? "Back" : "Close"}
            className="flex h-10 w-10 items-center justify-center"
          >
            <ChevronLeftIcon className="h-6 w-6" strokeWidth={2} />
          </button>
          <h2 id="pay-bill-title" className="text-center text-xl font-bold leading-none text-black">
            {steps[step].title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center">
            <CloseIcon className="h-6 w-6" strokeWidth={2} />
          </button>
        </header>

        {/* Re-keyed per step so each one slides in from the side it came from. */}
        <div
          key={step}
          style={{ "--step-from": forward ? "16px" : "-16px" } as CSSProperties}
          className="flex min-h-0 animate-step-in flex-col motion-reduce:animate-none"
        >
          {step === "how" && (
            <div className="mt-[26px] flex flex-col gap-[17px]">
              <PayOption onClick={splitTheBill}>Split the bill</PayOption>
              {/* Both pay the whole remaining balance and go straight to the tip
                  screen; the label changes once part of the bill is paid. */}
              <PayOption onClick={() => onPay(amount, "full")}>
                {splitMethod ? "Pay what's left" : "Pay in full"}
              </PayOption>
            </div>
          )}
          {/* Only reached before the table has a split method; after that
              "Split the bill" goes straight to the method's own screen. */}
          {step === "split" && (
            <div className="mt-[26px] flex flex-col gap-[17px]">
              <PayOption
                icon={<ListIcon className="h-[18px] w-[18px]" strokeWidth={1.6} />}
                onClick={() => goTo("items")}
              >
                Pay for your items
              </PayOption>
              <PayOption
                icon={<PieChartIcon className="h-[17px] w-[17px]" strokeWidth={1.6} />}
                onClick={() => goTo("equal")}
              >
                Divide the bill equally
              </PayOption>
            </div>
          )}
          {step === "equal" && (
            <DivideEqually
              amount={amount}
              tableTotal={tableTotal}
              plan={equalPlan}
              onConfirm={(total, share) => onPay(total, "equal", { share })}
            />
          )}
          {step === "left" && (
            <DivideEqually
              amount={amount}
              tableTotal={tableTotal}
              plan={equalPlan}
              sharesOnly
              onConfirm={(total, share) => onPay(total, "equal", { share })}
            />
          )}
          {step === "items" && (
            <PayForItems
              parties={parties}
              onCancel={() => backTo("how")}
              onConfirm={(total, lineKeys) => onPay(total, "items", { lineKeys })}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function PayOption({ icon, onClick, children }: { icon?: ReactNode; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-[58px] w-full items-center justify-center rounded-full bg-black text-xl leading-none text-white transition active:scale-[0.98]"
    >
      {icon && <span className="absolute left-[25px] top-1/2 -translate-y-1/2">{icon}</span>}
      {children}
    </button>
  );
}

export type EqualPlan = { people: number; sharesPaid: number };

function DivideEqually({
  amount,
  tableTotal,
  plan,
  sharesOnly = false,
  onConfirm,
}: {
  amount: number;
  tableTotal: number;
  plan?: EqualPlan;
  // Table already splitting equally: just pick how many remaining shares to pay.
  sharesOnly?: boolean;
  onConfirm: (total: number, share: EqualShare) => void;
}) {
  // The first equal split picks the head count (default: everyone who joined
  // the table). After that it's fixed and later payers take the shares left.
  const [people, setPeople] = useState(plan?.people ?? Math.max(MIN_PEOPLE, guests.length));
  const sharesPaid = plan?.sharesPaid ?? 0;
  const sharesLeft = Math.max(1, people - sharesPaid);
  const [payingFor, setPayingFor] = useState(1);
  // Whoever takes the last share pays the exact remainder, so rounding never
  // leaves a rupee or two on the table.
  const share = payingFor >= sharesLeft ? amount : Math.round((amount * payingFor) / sharesLeft);

  const changePeople = (next: number) => {
    const clamped = Math.min(MAX_PEOPLE, Math.max(MIN_PEOPLE, next));
    setPeople(clamped);
    setPayingFor((p) => Math.min(p, clamped));
  };

  return (
    <div className="px-[7px]">
      <div className="mt-5 flex justify-center py-2.5">
        <div className="relative h-[180px] w-[180px]">
          <ShareRing segments={people} paid={sharesPaid} filled={payingFor} accent={sharesOnly ? "plum" : "black"} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <p className="text-[28px] font-bold leading-tight text-black">PKR {formatAmount(amount)}</p>
            <p className="text-sm font-medium text-[#727272]">
              {plan && !sharesOnly ? "Left to share" : "Amount to share"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-4">
        <Stepper
          before="Paying for"
          after={plan && !sharesOnly ? (payingFor === 1 ? "share" : "shares") : payingFor === 1 ? "person" : "people"}
          value={payingFor}
          onChange={(n) => setPayingFor(Math.min(sharesLeft, Math.max(1, n)))}
          min={1}
          max={sharesLeft}
          label={plan && !sharesOnly ? "shares you're paying for" : "people you're paying for"}
        />
        {!sharesOnly && (
          <Stepper
            before="Out of"
            after="at the table"
            value={people}
            onChange={changePeople}
            min={plan ? people : MIN_PEOPLE}
            max={plan ? people : MAX_PEOPLE}
            label="people at the table"
          />
        )}
        {plan && !sharesOnly && (
          <p className="text-center text-sm font-medium text-[#727272]">
            {sharesPaid} of {people} shares already paid · {sharesLeft} left
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between pb-1 pt-3" aria-live="polite">
        <span className="text-lg font-bold text-[#727272]">You're paying</span>
        <span className="text-xl font-bold text-black">PKR {formatAmount(share)}</span>
      </div>
      <button
        type="button"
        onClick={() => onConfirm(share, { payingFor, people, tableBalance: tableTotal })}
        className="mt-5 h-14 w-full rounded-full bg-black text-base font-bold text-white transition active:scale-[0.98]"
      >
        Confirm
      </button>
    </div>
  );
}

function PayForItems({
  parties,
  onCancel,
  onConfirm,
}: {
  parties: BillParty[];
  onCancel: () => void;
  onConfirm: (total: number, lineKeys: string[]) => void;
}) {
  const withItems = parties.filter((party) => party.lines.length > 0);
  // Starts with your own dishes ticked.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(parties.filter((party) => party.isYou).flatMap((party) => party.lines.map((line) => line.key))),
  );

  const toggle = (keys: string[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const key of keys) {
        if (on) next.add(key);
        else next.delete(key);
      }
      return next;
    });

  const paying = withItems
    .flatMap((party) => party.lines)
    .filter((line) => selected.has(line.key))
    .reduce((sum, line) => sum + line.total, 0);

  return (
    <>
      <div className="-mx-[17px] mt-[26px] min-h-0 flex-1 overflow-y-auto overscroll-contain px-[17px] pb-4">
        <div className="flex flex-col gap-[17px]">
          {withItems.map((party) => {
            const keys = party.lines.map((line) => line.key);
            const picked = party.lines.filter((line) => selected.has(line.key));
            const state = picked.length === 0 ? "none" : picked.length === keys.length ? "all" : "some";
            const subtotal = picked.reduce((sum, line) => sum + line.total, 0);
            return (
              <div
                key={party.id}
                className={`flex flex-col gap-[21px] rounded-[15px] bg-[#e7e7e8] px-[19px] py-[23px] transition-shadow ${
                  state === "none" ? "" : "ring-2 ring-inset ring-black"
                }`}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={state === "all" ? true : state === "some" ? "mixed" : false}
                  onClick={() => toggle(keys, state !== "all")}
                  className="flex items-center justify-between text-left"
                >
                  <span className="text-base font-bold leading-none text-black">{party.name}</span>
                  <span className="flex items-center gap-[5px]">
                    {subtotal > 0 && (
                      <span className="text-sm font-medium text-[#727272]">PKR {formatAmount(subtotal)}</span>
                    )}
                    <TickBox state={state} />
                  </span>
                </button>
                <div className="flex flex-col gap-1.5">
                  {party.lines.map((line) => {
                    const on = selected.has(line.key);
                    return (
                      <button
                        key={line.key}
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        onClick={() => toggle([line.key], !on)}
                        className="flex items-center justify-between gap-3 rounded-[5px] bg-white px-3 py-[9px] text-left"
                      >
                        <span className="min-w-0 text-base font-bold leading-tight text-black">
                          {line.name}
                          {line.qty > 1 && <span className="font-medium text-[#727272]"> ×{line.qty}</span>}
                        </span>
                        <span className="flex shrink-0 items-center gap-[5px]">
                          <span className="text-sm font-medium text-[#727272]">PKR {formatAmount(line.total)}</span>
                          <TickBox state={on ? "all" : "none"} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="-mx-[17px] border-t border-[#727272] px-6 pt-4">
        <div className="flex items-center justify-between" aria-live="polite">
          <span className="text-lg font-bold text-[#727272]">You're paying</span>
          <span className="text-xl font-bold text-black">PKR {formatAmount(paying)}</span>
        </div>
        <div className="mt-5 flex gap-5">
          <button
            type="button"
            onClick={onCancel}
            className="h-14 flex-1 rounded-full bg-[#e7e7e8] text-base font-bold text-black transition active:scale-[0.98]"
          >
            Cancel Split
          </button>
          <button
            type="button"
            onClick={() => onConfirm(paying, [...selected])}
            disabled={paying === 0}
            className="h-14 flex-1 rounded-full bg-black text-base font-bold text-white transition active:scale-[0.98] disabled:opacity-35"
          >
            Confirm
          </button>
        </div>
      </div>
    </>
  );
}

// 20px square tick box; "some" shows a dash (part of a group ticked).
function TickBox({ state }: { state: "all" | "some" | "none" }) {
  return state === "none" ? (
    <span className="h-5 w-5 shrink-0 rounded-[3.5px] border border-[#727272]" />
  ) : (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[3.5px] bg-black text-white">
      {state === "all" ? (
        <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
      ) : (
        <MinusIcon className="h-3 w-3" strokeWidth={2.6} />
      )}
    </span>
  );
}

function Stepper({
  before,
  after,
  value,
  onChange,
  min,
  max,
  label,
}: {
  before: string;
  after: string;
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  label: string;
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="w-[90px] text-right text-base font-medium text-[#727272]">{before}</span>
      <div className="flex h-11 w-[116px] items-center justify-between rounded-full bg-black px-1">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`Fewer ${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white transition active:scale-90 disabled:opacity-40"
        >
          <MinusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
        <span className="text-base font-bold text-white" aria-label={`${value} ${label}`}>
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label={`More ${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white transition active:scale-90 disabled:opacity-40"
        >
          <PlusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>
      <span className="w-[90px] text-base font-medium text-[#727272]">{after}</span>
    </div>
  );
}

// Ring split into one segment per person, starting at 12 o'clock: shares
// already paid in light plum, then the `filled` shares being paid in black.
function ShareRing({
  segments,
  paid = 0,
  filled,
  accent = "black",
}: {
  segments: number;
  paid?: number;
  filled: number;
  accent?: "black" | "plum";
}) {
  const size = 180;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const gapDeg = segments > 1 ? 2.2 : 0; // half the white gap, each side

  const point = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return `${(c + r * Math.cos(rad)).toFixed(2)} ${(c + r * Math.sin(rad)).toFixed(2)}`;
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden="true">
      {Array.from({ length: segments }, (_, i) => {
        const start = (360 / segments) * i + gapDeg;
        const end = (360 / segments) * (i + 1) - gapDeg;
        const largeArc = end - start > 180 ? 1 : 0;
        return (
          <path
            key={i}
            d={`M ${point(start)} A ${r} ${r} 0 ${largeArc} 1 ${point(end)}`}
            fill="none"
            strokeWidth={stroke}
            className={`transition-colors duration-200 ${
              i < paid
                ? "stroke-plum/30"
                : i < paid + filled
                  ? accent === "plum"
                    ? "stroke-plum"
                    : "stroke-black"
                  : "stroke-[#e1e3ea]"
            }`}
          />
        );
      })}
    </svg>
  );
}
