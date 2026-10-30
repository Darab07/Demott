import { useEffect, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { modeIcon, PickupModeToggle } from "../components/PickupModePicker";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoIcon,
  LockIcon,
  MailIcon,
  PercentIcon,
  ShieldCheckIcon,
  UserIcon,
} from "../components/icons";
import { asset } from "../lib/asset";
import { useCart } from "../lib/cart";
import { useFlow } from "../lib/flow";
import { tapFeedback } from "../lib/haptics";
import { formatAmount } from "../lib/menu";
import { INSTANT_FEE_RATE, loadPayment, recordPayment, type CompletedPayment } from "../lib/payment";
import {
  loadPickupDetails,
  savePickupDetails,
  savePickupOrder,
  usePickupMode,
  type CarDetails,
  type PickupDetails,
} from "../lib/pickup";

type Method = "easypaisa" | "jazzcash" | "card";

// Logos live in public/images/logos/; until a file exists the box shows a
// short text label instead.
// `payLogo` is a white version shown inside the black Pay button.
const methods: { id: Method; name: string; logos: { src: string; label: string }[]; payLogo?: string }[] = [
  {
    id: "easypaisa",
    name: "Easypaisa",
    logos: [{ src: "images/logos/easypaisa.png", label: "easypaisa" }],
    payLogo: "images/logos/easypaisa-white.png",
  },
  { id: "jazzcash", name: "Jazzcash", logos: [{ src: "images/logos/jazzcash.png", label: "JazzCash" }] },
  {
    id: "card",
    name: "Debit Card",
    logos: [
      { src: "images/logos/visa.png", label: "VISA" },
      { src: "images/logos/mastercard.png", label: "MC" },
      { src: "images/logos/unionpay.png", label: "UnionPay" },
    ],
  },
];

const PROCESSING_MS = 1400;
const DEMO_PROMO = { code: "TABLETAP10", rate: 0.1 }; // 10% off the food, not the tip

export function Checkout() {
  const [, navigate] = useLocation();
  const [payment] = useState(loadPayment);
  const [method, setMethod] = useState<Method>("easypaisa");
  const [showFeeInfo, setShowFeeInfo] = useState(false);

  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [expense, setExpense] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Curbside / Pickup: who to tell when it's ready, and which car to bring it
  // to. Pre-filled from the last order on this device.
  const flow = useFlow();
  const cart = useCart();
  const mode = usePickupMode();
  const [saved] = useState(loadPickupDetails);
  const [details, setDetails] = useState<PickupDetails>(() => ({
    name: saved?.name ?? "",
    phone: saved?.phone ?? "",
    car: { plate: "", model: "", spot: "", ...saved?.car },
  }));
  // A returning guest sees their saved details as a card; Edit opens the form.
  const [editDetails, setEditDetails] = useState(() => !(saved?.name.trim() && saved.phone.trim()));
  const [editCar, setEditCar] = useState(() => !(saved?.car?.plate.trim() && saved.car.model.trim()));
  const [missing, setMissing] = useState<string[]>([]);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const setDetail = (field: "name" | "phone", value: string) => {
    setDetails((d) => ({ ...d, [field]: value }));
    setMissing((m) => m.filter((f) => f !== field));
  };
  const setCarField = (field: keyof CarDetails, value: string) => {
    setDetails((d) => ({ ...d, car: { ...d.car, [field]: value } }));
    setMissing((m) => m.filter((f) => f !== field));
  };

  // Switching between Pickup and Curbside clears the car-field errors.
  useEffect(() => setMissing([]), [mode]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!payment) return <Redirect to="/" />;

  const subtotal = payment.amount;
  const discount = promoApplied ? Math.round(subtotal * DEMO_PROMO.rate) : 0;
  const tip = payment.tip ?? 0;
  const fee = Math.round((subtotal - discount) * INSTANT_FEE_RATE);
  const total = subtotal - discount + tip + fee;
  const selectedMethod = methods.find((m) => m.id === method)!;

  const applyPromo = () => {
    if (promoInput.trim().toUpperCase() === DEMO_PROMO.code) {
      setPromoApplied(true);
      setPromoError("");
      setPromoOpen(false);
      tapFeedback();
    } else {
      setPromoError("That code isn't valid");
      tapFeedback([10, 40, 10]);
    }
  };

  const pay = () => {
    if (flow === "pickup") {
      const required = ["name", "phone", ...(mode === "curbside" ? ["plate", "model"] : [])];
      const values: Record<string, string> = { name: details.name, phone: details.phone, ...details.car };
      const empty = required.filter((field) =>
        field === "phone" ? details.phone.replace(/\D/g, "").length < 10 : !values[field].trim(),
      );
      setMissing(empty);
      if (empty.length) {
        tapFeedback([10, 40, 10]);
        if (empty.some((f) => f === "name" || f === "phone")) setEditDetails(true);
        if (empty.some((f) => f === "plate" || f === "model")) setEditCar(true);
        requestAnimationFrame(() => document.getElementById(`pickup-${empty[0]}`)?.focus());
        return;
      }
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("Enter a valid email, or leave it empty");
      document.getElementById("receipt-email")?.focus();
      return;
    }
    setEmailError("");
    if (processing) return;

    // Demo: a short "processing" beat, then the payment is recorded against
    // the table and the guest sees whether the table is now fully paid.
    setProcessing(true);
    setTimeout(() => {
      tapFeedback([15, 60, 15]);
      const now = new Date();
      const remainingBefore = payment.remaining ?? subtotal;
      if (flow === "pickup") {
        const orderNo = `BH-${randomDigits(4)}`;
        const name = details.name.trim();
        savePickupDetails({ ...details, name, phone: details.phone.trim() });
        const completed: CompletedPayment = {
          receiptNo: receiptNumber(now),
          reference: randomDigits(12),
          paidAt: now.toISOString(),
          kind: "full",
          items: payment.items ?? [],
          remainingAfter: 0,
          amount: subtotal,
          discount,
          tip,
          tipPercent: payment.tipPercent,
          fee,
          total,
          method: selectedMethod.name,
          email: email || undefined,
          settled: true,
          pickup: { orderNo, mode, name },
        };
        savePickupOrder({
          orderNo,
          mode,
          name,
          phone: details.phone.trim(),
          car: mode === "curbside" ? details.car : undefined,
          payment: completed,
        });
        cart.clear(); // paid for: the next order starts empty
        navigate("/paid", { replace: true });
        return;
      }
      recordPayment(
        {
          receiptNo: receiptNumber(now),
          reference: randomDigits(12),
          paidAt: now.toISOString(),
          kind: payment.kind,
          items: payment.items ?? [],
          share: payment.share,
          remainingAfter: Math.max(0, remainingBefore - subtotal),
          amount: subtotal,
          discount,
          tip,
          tipPercent: payment.tipPercent,
          fee,
          total,
          method: selectedMethod.name,
          email: email || undefined,
          settled: subtotal >= remainingBefore,
        },
        payment.lineKeys,
      );
      navigate("/paid", { replace: true });
    }, PROCESSING_MS);
  };

  return (
    <main
      className={`mx-auto min-h-screen max-w-phone ${
        flow === "pickup" ? "pb-[calc(env(safe-area-inset-bottom)+90px)]" : "pb-[calc(env(safe-area-inset-bottom)+110px)]"
      }`}
    >
      <header className="grid grid-cols-[44px_1fr_44px] items-center px-5 pt-[calc(env(safe-area-inset-top)+22px)]">
        <button
          type="button"
          aria-label={flow === "pickup" ? "Back to your order" : "Back to tip"}
          onClick={() => navigate(flow === "pickup" ? "/order" : "/tip")}
          className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-inset ring-hairline"
        >
          <ChevronLeftIcon className="h-5 w-5" strokeWidth={2} />
        </button>
        <h1 className="text-center text-2xl font-medium leading-none">{flow === "pickup" ? "Checkout" : "Your Order"}</h1>
      </header>

      <div className={`mt-[21px] flex flex-col ${flow === "pickup" ? "gap-[30px] px-5" : "gap-[45px] px-[13px]"}`}>
        {flow === "pickup" && (
          <>
            <PickupModeToggle className="-mt-[15px]" />
            {/* Highlighted together on the tour. */}
            <div data-tour="pickup-details" className="flex flex-col gap-[30px]">
              <section className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-lg font-medium leading-none">Your details</h2>
                  <p className="text-[15px] font-medium leading-tight text-ink-muted">
                    {!editDetails
                      ? "Welcome back — saved from your last order"
                      : mode === "curbside"
                        ? "So the team knows who they’re bringing it to"
                        : "So we can tell you when it’s ready at the counter"}
                  </p>
                </div>
                {!editDetails ? (
                  <SavedCard
                    icon={<UserIcon className="h-5 w-5" strokeWidth={1.6} />}
                    title={details.name}
                    detail={details.phone}
                    editLabel="Edit your details"
                    onEdit={() => {
                      setEditDetails(true);
                      requestAnimationFrame(() => document.getElementById("pickup-name")?.focus());
                    }}
                  />
                ) : (
                  <>
                    <LabeledField
                      id="pickup-name"
                      label="Name"
                      autoComplete="name"
                      placeholder="Your name"
                      value={details.name}
                      onChange={(e) => setDetail("name", e.target.value)}
                      invalid={missing.includes("name")}
                    />
                    <LabeledField
                      id="pickup-phone"
                      label="Mobile number"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="0300 1234567"
                      value={details.phone}
                      onChange={(e) => setDetail("phone", e.target.value)}
                      invalid={missing.includes("phone")}
                    />
                  </>
                )}
                {missing.includes("name") || missing.includes("phone") ? (
                  <p className="px-1 text-sm font-medium text-red-700">
                    {!missing.includes("name") && details.phone.trim()
                      ? "Enter a full mobile number, e.g. 0300 1234567."
                      : mode === "curbside"
                        ? "Add your name and number so the team knows who it’s for."
                        : "Add your name and number so we can tell you when it’s ready."}
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink-muted">
                    <ShieldCheckIcon className="h-4 w-4 shrink-0 text-[#2E7D4F]" strokeWidth={1.6} />
                    {!editDetails ? "Saved on this device. Tap Edit to change." : "Saved on this device after your first order"}
                  </p>
                )}
              </section>

              {mode === "curbside" && (
                <section className="flex animate-step-in flex-col gap-3 motion-reduce:animate-none">
                  <div className="flex flex-col gap-1.5">
                    <h2 className="text-lg font-medium leading-none">Your car</h2>
                    <p className="text-[15px] font-medium leading-tight text-ink-muted">
                      {editCar ? "Both required, so the team can find you" : "Saved from your last curbside order"}
                    </p>
                  </div>
                  {!editCar ? (
                    <SavedCard
                      icon={modeIcon("curbside", "h-5 w-5")}
                      title={details.car.plate.toUpperCase()}
                      detail={[details.car.model.trim(), details.car.spot.trim()].filter(Boolean).join(" · ")}
                      editLabel="Edit your car"
                      onEdit={() => {
                        setEditCar(true);
                        requestAnimationFrame(() => document.getElementById("pickup-plate")?.focus());
                      }}
                    />
                  ) : (
                    <>
                      <LabeledField
                        id="pickup-plate"
                        label="Number plate *"
                        placeholder="e.g. LEB 1234"
                        autoCapitalize="characters"
                        value={details.car.plate}
                        onChange={(e) => setCarField("plate", e.target.value)}
                        invalid={missing.includes("plate")}
                      />
                      <LabeledField
                        id="pickup-model"
                        label="Car model & colour *"
                        placeholder="e.g. White Toyota Corolla"
                        value={details.car.model}
                        onChange={(e) => setCarField("model", e.target.value)}
                        invalid={missing.includes("model")}
                      />
                      <LabeledField
                        id="pickup-spot"
                        label="Parking spot · optional"
                        placeholder="e.g. near the entrance"
                        value={details.car.spot}
                        onChange={(e) => setCarField("spot", e.target.value)}
                      />
                    </>
                  )}
                  {(missing.includes("plate") || missing.includes("model")) && (
                    <p className="px-1 text-sm font-medium text-red-700">
                      Add your number plate and car so the team can find you.
                    </p>
                  )}
                </section>
              )}
            </div>
          </>
        )}

        {/* Payment method */}
        <section className="flex flex-col gap-5">
          <SectionTitle title="Pay securely" subtitle="All transactions are private and encrypted" />
          <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Payment method">
            {methods.map((m) => {
              const selected = m.id === method;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center justify-between rounded-[19px] bg-white px-[15px] py-5 text-left ring-2 ring-inset transition-shadow ${
                    selected ? "ring-black" : "ring-ink/20"
                  }`}
                >
                  <span className="text-base font-medium leading-none">{m.name}</span>
                  <span className="flex items-center gap-2.5">
                    {m.logos.map((logo) => (
                      <LogoBox key={logo.src} {...logo} />
                    ))}
                    {selected ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white">
                        <CheckIcon className="h-4 w-4" strokeWidth={2.2} />
                      </span>
                    ) : (
                      <span className="h-6 w-6 rounded-full border-2 border-ink/20" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Promo, then totals */}
        <section className="flex flex-col gap-[15px]">
          <button
            type="button"
            onClick={() => setPromoOpen((o) => !o)}
            aria-expanded={promoOpen}
            className="flex items-center justify-between text-left"
          >
            <span className="flex items-center gap-5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white">
                <PercentIcon className="h-[14px] w-[14px]" />
              </span>
              <span className="text-lg font-medium leading-none">
                {promoApplied ? `Promo applied: ${DEMO_PROMO.code}` : "Add a promo code"}
              </span>
            </span>
            <ChevronRightIcon
              className={`h-5 w-5 transition-transform duration-200 ${promoOpen ? "rotate-90" : ""}`}
              strokeWidth={2}
            />
          </button>
          {promoOpen && (
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value);
                    setPromoError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                  placeholder="Promo code"
                  autoCapitalize="characters"
                  aria-label="Promo code"
                  className="min-w-0 flex-1 rounded-[19px] bg-white px-[15px] py-3.5 text-base font-medium uppercase outline-none ring-2 ring-inset ring-ink/20 placeholder:normal-case placeholder:text-[#888] focus:ring-black"
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  className="rounded-[19px] bg-black px-5 text-base font-bold text-white transition active:scale-[0.97]"
                >
                  Apply
                </button>
              </div>
              {promoError && <p className="px-1 text-sm font-medium text-red-700">{promoError}</p>}
            </div>
          )}

        </section>

        {flow === "pickup" ? (
          // No tip or split here: the dishes, then a Total that opens the fees.
          <section className="flex flex-col gap-3.5">
            <h2 className="text-lg font-medium leading-none">Your order</h2>
            {(payment.items ?? []).map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-3">
                <span className="text-[15px] font-medium text-ink/80">
                  {item.qty} × {item.name}
                </span>
                <span className="shrink-0 text-base font-bold text-black">PKR {formatAmount(item.total)}</span>
              </div>
            ))}
            <div className="h-px bg-ink/15" />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowBreakdown((s) => !s)}
                aria-expanded={showBreakdown}
                className="flex items-center gap-1.5 text-xl font-bold leading-none text-black"
              >
                Total
                <ChevronDownIcon
                  className={`h-5 w-5 transition-transform duration-200 ${showBreakdown ? "rotate-180" : ""}`}
                  strokeWidth={2}
                />
              </button>
              <span className="text-xl font-bold text-black">PKR {formatAmount(total)}</span>
            </div>
            <div
              className={`-mt-3.5 grid transition-[grid-template-rows] duration-200 ease-out ${
                showBreakdown ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="flex flex-col gap-2.5 overflow-hidden">
                <span className="h-1" />
                <SummaryRow label="Subtotal" value={subtotal} />
                {discount > 0 && <SummaryRow label={`Promo (${DEMO_PROMO.code})`} value={-discount} />}
                <SummaryRow label="Instant payment fees" value={fee} />
              </div>
            </div>
          </section>
        ) : (
          <section className="flex flex-col gap-[15px]">
            <SummaryRow label="Subtotal" value={subtotal} />
            {discount > 0 && <SummaryRow label={`Promo (${DEMO_PROMO.code})`} value={-discount} />}
            <SummaryRow label={payment.tipPercent ? `Tips (${payment.tipPercent}%)` : "Tip"} value={tip} />
            <SummaryRow
              label="Instant payment fees"
              value={fee}
              extra={
                <button
                  type="button"
                  onClick={() => setShowFeeInfo((s) => !s)}
                  aria-label="About instant payment fees"
                  aria-expanded={showFeeInfo}
                  className="text-ink-muted"
                >
                  <InfoIcon className="h-[18px] w-[18px]" />
                </button>
              }
            />
            {showFeeInfo && (
              <p className="-mt-2 rounded-xl bg-ink/5 px-3 py-2 text-[13px] font-medium text-ink-muted">
                A 1% fee charged by the payment provider so the restaurant receives your payment instantly.
              </p>
            )}
            <div className="h-px bg-ink/60" />
            <SummaryRow label="Total" value={total} />
          </section>
        )}

        {/* Receipt */}
        {flow !== "pickup" && (
          <section className="flex flex-col gap-[9px]">
            <SectionTitle
              title="Get your receipt"
              subtitle="Add your details to receive your receipt after payment. It’ll be sent automatically by email."
            />
            <Field
              id="receipt-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              icon={<MailIcon className="h-6 w-6 text-[#ccd1d0]" />}
              invalid={!!emailError}
            />
            {emailError && <p className="px-1 text-sm font-medium text-red-700">{emailError}</p>}

            <div className="mt-[9px] flex items-center justify-between">
              <span className="text-lg font-medium leading-none">I need an expense receipt</span>
              <button
                type="button"
                onClick={() => setExpense((e) => !e)}
                aria-expanded={expense}
                className={`rounded-full px-2.5 py-[5px] text-base font-medium leading-none transition-colors ${
                  expense ? "text-[#888] ring-1 ring-inset ring-[#ccd1d0]" : "bg-[#ccd1d0] text-ink"
                }`}
              >
                {expense ? "Remove" : "Add"}
              </button>
            </div>

            {expense && (
              <div className="flex animate-step-in flex-col gap-[9px] motion-reduce:animate-none">
                <p className="text-base font-bold leading-[1.1] text-ink-muted">Add your details below (optional)</p>
                <Field placeholder="Number of guests" type="number" inputMode="numeric" min={1} />
                <Field placeholder="Attendees names" autoComplete="off" />
                <Field placeholder="Business purpose" autoComplete="off" />
                <div className="flex items-center gap-2.5 py-1">
                  <span className="h-[1.5px] flex-1 bg-[#888]" />
                  <span className="text-base font-medium leading-none text-[#888]">Company details</span>
                  <span className="h-[1.5px] flex-1 bg-[#888]" />
                </div>
                <Field placeholder="Company Name" autoComplete="organization" />
                <Field placeholder="Address" autoComplete="street-address" />
                <div className="flex gap-[9px]">
                  <Field placeholder="City" autoComplete="address-level2" className="w-[62%]" />
                  <Field placeholder="Zip Code" autoComplete="postal-code" inputMode="numeric" className="min-w-0 flex-1" />
                </div>
                <Field placeholder="Country" autoComplete="country-name" />
              </div>
            )}
          </section>
        )}
      </div>

      <div className={`flex flex-col items-center gap-[13px] ${flow === "pickup" ? "mt-[30px] px-5" : "mt-[21px] px-6"}`}>
        <p className="text-center text-sm font-medium leading-[1.1] text-ink-muted">
          By continuing, I agree to the <span className="underline">User Terms</span> and{" "}
          <span className="underline">Privacy Policy</span>
        </p>
        {flow === "pickup" && payButton()}
        <p className="flex items-center gap-[5px] text-sm font-medium text-ink-muted">
          <LockIcon className="h-[15px] w-[15px]" />
          secure payments with
          <span className="text-[15px] font-bold tracking-[-0.03em] text-plum">tabletap.</span>
        </p>
      </div>

      {/* Pinned exactly where the menu's "View your order" button sits. */}
      {flow !== "pickup" && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-phone px-[25px] pb-[calc(env(safe-area-inset-bottom)+20px)]">
          {payButton()}
        </div>
      )}
    </main>
  );

  function payButton() {
    return (
      <button
        type="button"
        onClick={pay}
        aria-busy={processing}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-[22px] text-xl leading-none text-white transition active:scale-[0.98]"
      >
        {processing ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Processing…
          </>
        ) : (
          <>
            Pay with
            {selectedMethod.payLogo ? (
              <img src={asset(selectedMethod.payLogo)} alt={selectedMethod.name} className="h-5 w-auto" />
            ) : (
              <span className="font-bold">{selectedMethod.name}</span>
            )}
          </>
        )}
      </button>
    );
  }
}

// Demo receipt number, e.g. "BH-261027-4821": restaurant prefix, date, sequence.
function receiptNumber(date: Date) {
  const ymd = [date.getFullYear() % 100, date.getMonth() + 1, date.getDate()]
    .map((n) => String(n).padStart(2, "0"))
    .join("");
  return `BH-${ymd}-${randomDigits(4)}`;
}

const randomDigits = (count: number) =>
  Array.from({ length: count }, () => Math.floor(Math.random() * 10)).join("");

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-[9px]">
      <h2 className="text-lg font-medium leading-none">{title}</h2>
      <p className="text-base font-bold leading-[1.1] text-ink-muted">{subtitle}</p>
    </div>
  );
}

function SummaryRow({ label, value, extra }: { label: string; value: number; extra?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-ink-muted">{label}</span>
      <span className="flex items-center gap-2.5">
        {extra}
        <span className="text-lg font-bold text-black">
          {value < 0 ? "− " : ""}PKR {formatAmount(Math.abs(value))}
        </span>
      </span>
    </div>
  );
}

function Field({
  icon,
  invalid,
  className = "",
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode; invalid?: boolean }) {
  return (
    <label
      className={`flex items-center gap-3 rounded-[19px] bg-white px-[15px] py-5 ring-2 ring-inset transition-shadow ${
        invalid ? "ring-red-600" : "ring-ink/20 focus-within:ring-black"
      } ${className}`}
    >
      <input
        {...input}
        aria-label={input["aria-label"] ?? input.placeholder}
        className="min-w-0 flex-1 bg-transparent text-base font-medium leading-none outline-none placeholder:text-[#888]"
      />
      {icon}
    </label>
  );
}

// Payment brand logo in its small bordered box; falls back to a text label
// until the logo file is added.
function LogoBox({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="flex h-6 w-[35px] items-center justify-center overflow-hidden rounded border border-[#d9d9d9] bg-white">
      {failed ? (
        <span className="px-0.5 text-[7px] font-black uppercase leading-none tracking-tight text-ink">{label}</span>
      ) : (
        <img src={asset(src)} alt={label} onError={() => setFailed(true)} className="max-h-4 max-w-[31px] object-contain" />
      )}
    </span>
  );
}

// Bordered box with a small label above the input (pickup details).
function LabeledField({
  label,
  invalid,
  className = "",
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { label: string; invalid?: boolean }) {
  return (
    <label
      className={`flex flex-col gap-1 rounded-[19px] bg-white px-[18px] py-3 ring-[1.5px] ring-inset transition-shadow ${
        invalid ? "ring-red-600" : "ring-ink/20 focus-within:ring-black"
      } ${className}`}
    >
      <span className="text-[13px] font-medium leading-tight text-ink-muted">{label}</span>
      <input
        {...input}
        className="min-w-0 bg-transparent text-base font-semibold leading-tight outline-none placeholder:font-medium placeholder:text-[#aaa]"
      />
    </label>
  );
}

// Saved details shown as one card, with Edit to open the form again.
function SavedCard({
  icon,
  title,
  detail,
  editLabel,
  onEdit,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  editLabel: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-[19px] bg-white px-[18px] py-4 ring-1 ring-inset ring-ink/20">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink/5">{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="truncate text-base font-semibold leading-tight">{title}</span>
        {detail && <span className="text-sm font-medium leading-tight text-ink-muted">{detail}</span>}
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={editLabel}
        className="shrink-0 text-[15px] font-bold underline underline-offset-4"
      >
        Edit
      </button>
    </div>
  );
}
