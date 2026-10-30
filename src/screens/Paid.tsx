import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { Photo } from "../components/Photo";
import { ReceiptPaper, receiptText } from "../components/Receipt";
import { CheckIcon, ChevronLeftIcon, CloseIcon, HeartIcon, ReceiptIcon, StarIcon } from "../components/icons";
import { useCart } from "../lib/cart";
import { copyText } from "../lib/clipboard";
import { tapFeedback } from "../lib/haptics";
import { formatAmount, restaurant } from "../lib/menu";
import { loadLedger, resetLedger, type CompletedPayment } from "../lib/payment";
import { useOverlay } from "../lib/useOverlay";

const REVIEW_DELAY_MS = 700; // let the result land before the review slides up
export const POINTS_PER_PKR = 0.085; // loyalty points earned per rupee charged
// Mobile Safari's floating toolbar sits over the bottom of the page; this much
// extra room lets everything scroll up clear of it.
export const BROWSER_BAR_CLEARANCE = "pb-[calc(env(safe-area-inset-bottom)+110px)]";

// After paying: "table is paid" when the balance is cleared, otherwise "not
// fully paid yet" with what's been paid so far. The review sheet slides up
// over either.
export function Paid() {
  const [, navigate] = useLocation();
  const cart = useCart();
  const [ledger] = useState(loadLedger);
  const last = ledger.last;

  const [reviewOpen, setReviewOpen] = useState(false);
  const closeReview = useCallback(() => setReviewOpen(false), []);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const closeReceipt = useCallback(() => setReceiptOpen(false), []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setReviewOpen(true), REVIEW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!last) return <Redirect to="/" />;

  const settled = last.settled;
  const points = Math.round(last.total * POINTS_PER_PKR);

  const close = () => {
    if (settled) {
      // Table settled: start the demo over with a fresh order.
      cart.clear();
      resetLedger();
      navigate("/");
    } else {
      // Order is now locked; the menu shows payment progress and Pay.
      navigate("/");
    }
  };

  return (
    <main className={`mx-auto min-h-[100dvh] max-w-phone ${BROWSER_BAR_CLEARANCE}`}>
      <header className="flex justify-end px-5 pt-[calc(env(safe-area-inset-top)+22px)]">
        <button
          type="button"
          onClick={close}
          aria-label={settled ? "Done" : "Back to the menu"}
          className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-inset ring-hairline"
        >
          <CloseIcon className="h-5 w-5" strokeWidth={2} />
        </button>
      </header>

      <div className="mt-[21px] flex flex-col gap-[21px] px-[13px]">
        <div className="flex flex-col gap-3">
          <h1 className="text-[30px] font-bold leading-[0.94]">
            {settled ? "Thanks! Your table is paid. You’re good to go!" : "Thanks! Your table is not fully paid yet."}
          </h1>
          <p className="text-base font-bold leading-[1.1] text-ink-muted">
            {settled
              ? "The waiter knows the bill is paid. Feel free to head out and don’t hesitate to say bye!"
              : "To settle the remaining balance pay the rest of the bill or remind others to complete their payments."}
          </p>
          {!settled && (
            <div className="flex items-center justify-between text-[17px] font-medium leading-none text-black">
              <span>Already paid</span>
              <span>PKR {formatAmount(ledger.paidTotal)}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setReceiptOpen(true)}
          className="relative flex w-full items-center justify-center rounded-full bg-black py-[22px] text-[17px] font-medium leading-none text-white transition active:scale-[0.98]"
        >
          <ReceiptIcon className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-white" />
          Get my receipt
        </button>

        <LoyaltyCard points={points} />
      </div>

      <ReceiptSheet open={receiptOpen} payment={last} onClose={closeReceipt} />
      <ReviewSheet open={reviewOpen} onClose={closeReview} />
    </main>
  );
}

export function LoyaltyCard({ points }: { points: number }) {
  return (
    <section
      aria-label={`You earned ${points} points`}
      className="relative flex h-[217px] flex-col items-center justify-center overflow-hidden rounded-[28px] bg-[#2f3a9e] text-white"
    >
      {/* Decorative plates and a soft light, as in the design. */}
      <span className="absolute -left-14 -top-16 h-36 w-36 rounded-full bg-[#e9e9ec] shadow-[inset_-10px_-10px_0_#c9c9cf]" />
      <span className="absolute -bottom-14 -right-12 h-32 w-32 rounded-full bg-[#e9e9ec] shadow-[inset_8px_8px_0_#c9c9cf]" />
      <span className="absolute -right-6 -top-10 h-24 w-24 rounded-full bg-white/70 blur-xl" />

      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#2f3a9e]">
        <HeartIcon className="h-4 w-4" />
      </span>
      <p className="relative mt-2.5 text-[15px] font-medium text-white/75">You earned</p>
      <p className="relative mt-1 text-[34px] font-bold leading-none">{points} points</p>
      <button
        type="button"
        className="relative mt-4 rounded-full bg-white px-5 py-2.5 text-[15px] font-bold leading-none text-black transition active:scale-[0.97]"
      >
        Your advantages
      </button>
    </section>
  );
}

const REVIEW_TOPICS = ["Food and drinks", "Service", "Ambiance", "Value for money"];
const FACES = ["Very bad", "Bad", "Okay", "Good", "Very good"];

// Star rating first; once a star is picked the sheet grows into "Can you tell
// us more?" (ratings per topic), with the stars still changeable at the top.
function ReviewSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  useOverlay(open, onClose);
  const [rating, setRating] = useState(0);
  const [topics, setTopics] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  // After submitting: a short thank-you, then the sheet slides away.
  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(onClose, 1600);
    return () => clearTimeout(timer);
  }, [submitted, onClose]);

  const expanded = rating > 0 && !submitted;

  const stars = (
    <div className="flex w-[240px] flex-col items-center gap-3">
      <div className="flex gap-2.5" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => {
              tapFeedback();
              setRating(n);
            }}
            className="transition active:scale-90"
          >
            <StarIcon
              className={`h-9 w-9 transition-colors duration-200 ${
                n <= rating ? "fill-plum text-plum" : "fill-[#d9d9d9] text-[#d9d9d9]"
              }`}
              strokeWidth={2}
            />
          </button>
        ))}
      </div>
      <div className="flex w-full justify-between px-1.5 text-xs font-medium text-[#8e8e93]">
        <span>Bad</span>
        <span>Good</span>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onClose={onClose} label="Review" dim="bg-black/50">
      <header className="grid grid-cols-[40px_1fr_40px] items-center">
        <button type="button" onClick={onClose} aria-label="Close review" className="flex h-10 w-10 items-center justify-center">
          <ChevronLeftIcon className="h-6 w-6" strokeWidth={2} />
        </button>
        <h2 className="text-center text-xl font-bold leading-none text-black">Review</h2>
      </header>

      {submitted ? (
        <div className="flex animate-step-in flex-col items-center gap-3 px-6 pb-6 pt-14 text-center motion-reduce:animate-none">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-plum text-white">
            <CheckIcon className="h-7 w-7" strokeWidth={2.4} />
          </span>
          <p className="text-2xl font-bold leading-tight">Thanks for your feedback!</p>
          <p className="text-base font-bold text-ink-muted">It helps {restaurant.name} keep getting better.</p>
        </div>
      ) : expanded ? (
        <div className="flex animate-step-in flex-col items-center gap-[51px] pt-12 motion-reduce:animate-none">
          <div className="flex flex-col items-center gap-3">
            <p className="text-center text-base font-bold leading-[1.1] text-ink-muted">You can still change your rating</p>
            {stars}
          </div>

          <div className="flex flex-col gap-3 text-center">
            <p className="text-2xl font-bold leading-[0.94]">Can you tell us more?</p>
            <p className="text-base font-bold leading-[1.1] text-ink-muted">
              You’ve been served by {restaurant.server}.
            </p>
          </div>

          <div className="flex w-full flex-col gap-[15px]">
            {REVIEW_TOPICS.map((topic) => (
              <div key={topic} className="flex items-center justify-between gap-3">
                <span className="text-base font-bold leading-[1.1] text-black">{topic}</span>
                <div className="flex gap-[11px]" role="radiogroup" aria-label={topic}>
                  {FACES.map((face, index) => {
                    const value = index + 1;
                    const selected = topics[topic] === value;
                    return (
                      <button
                        key={face}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={`${topic}: ${face}`}
                        onClick={() => {
                          tapFeedback();
                          setTopics((prev) => ({ ...prev, [topic]: value }));
                        }}
                        className={`rounded-full transition active:scale-90 ${
                          selected ? "scale-110 text-plum" : topics[topic] ? "text-black/35" : "text-black"
                        }`}
                      >
                        <FaceIcon mood={value} filled={selected} className="h-[27px] w-[27px]" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSubmitted(true)}
            className="h-14 w-full rounded-full bg-black text-base font-bold text-white transition active:scale-[0.98]"
          >
            Submit review
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-[51px] pt-12">
          <div className="flex flex-col items-center gap-4">
            <div className="h-[85px] w-[85px] overflow-hidden rounded-full border border-icon-muted bg-white p-2">
              <Photo src={restaurant.logo} alt={`${restaurant.name} logo`} className="h-full w-full !bg-transparent" />
            </div>
            <div className="flex flex-col gap-3 text-center">
              <p className="text-2xl font-bold leading-[0.94]">On a scale of 1-5, how would you rate your experience today?</p>
              <p className="text-base font-bold leading-[1.1] text-ink-muted">Click on stars to rate from 1 to 5</p>
            </div>
          </div>
          {stars}
        </div>
      )}
    </Sheet>
  );
}

// Smiley from 1 (very unhappy) to 5 (very happy); filled when selected.
function FaceIcon({ mood, filled, className }: { mood: number; filled: boolean; className?: string }) {
  const mouth = [
    "M8.5 17.5c1-1.6 2.1-2.3 3.5-2.3s2.5.7 3.5 2.3", // very unhappy
    "M9 16.5c.9-.8 1.9-1.2 3-1.2s2.1.4 3 1.2", // unhappy
    "M9 15.5h6", // neutral
    "M9 14.5c.9.9 1.9 1.4 3 1.4s2.1-.5 3-1.4", // happy
    "M8.5 13.5c1 1.9 2.1 2.8 3.5 2.8s2.5-.9 3.5-2.8", // very happy
  ][mood - 1];
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="10" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} />
      <g stroke={filled ? "white" : "currentColor"} strokeWidth={2} strokeLinecap="round">
        <path d="M9 9.5h.01M15 9.5h.01" strokeWidth={2.6} />
        <path d={mouth} />
      </g>
    </svg>
  );
}

export function ReceiptSheet({ open, payment, onClose }: { open: boolean; payment: CompletedPayment; onClose: () => void }) {
  useOverlay(open, onClose);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  // Native share sheet where available; otherwise copy the text version.
  const share = async () => {
    const text = receiptText(payment);
    if (navigator.share) {
      try {
        await navigator.share({ title: `${restaurant.name} receipt ${payment.receiptNo}`, text });
        return;
      } catch (err) {
        if ((err as DOMException).name === "AbortError") return;
      }
    }
    if (await copyText(text)) setCopied(true);
  };

  return (
    <Sheet open={open} onClose={onClose} label="Your receipt" dim="bg-black/40" tint="bg-cream">
      <header className="grid grid-cols-[40px_1fr_40px] items-center">
        <span />
        <h2 className="text-center text-xl font-bold leading-none text-black">Your receipt</h2>
        <button type="button" onClick={onClose} aria-label="Close receipt" className="flex h-10 w-10 items-center justify-center">
          <CloseIcon className="h-6 w-6" strokeWidth={2} />
        </button>
      </header>

      <div className="mt-5 px-1">
        <ReceiptPaper payment={payment} />
      </div>

      {payment.email && (
        <p className="mt-4 text-center text-sm font-medium text-ink-muted">
          A copy has been sent to <span className="font-bold text-ink">{payment.email}</span>
        </p>
      )}
      <button
        type="button"
        onClick={share}
        className="mt-4 h-14 w-full rounded-full bg-black text-base font-bold text-white transition active:scale-[0.98]"
      >
        {copied ? "Receipt copied" : "Share receipt"}
      </button>
    </Sheet>
  );
}

// Plain bottom sheet with a dimmed backdrop.
export function Sheet({
  open,
  onClose,
  label,
  dim,
  tint = "bg-white",
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  dim: string;
  tint?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`fixed inset-0 z-50 mx-auto max-w-phone transition-[visibility] duration-300 ${
        open ? "visible" : "invisible"
      }`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 transition-opacity duration-300 ${dim} ${open ? "opacity-100" : "opacity-0"}`}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`absolute inset-x-0 bottom-0 max-h-[calc(100dvh-60px)] overflow-y-auto overscroll-contain rounded-t-[23px] ${tint} px-[17px] pt-4 transition-transform duration-500 ease-out ${BROWSER_BAR_CLEARANCE} ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {children}
      </section>
    </div>
  );
}
