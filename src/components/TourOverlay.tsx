import { useEffect, useRef, useState } from "react";
import { useTour } from "../lib/tour";

const SPOT_PAD = 6; // px of breathing room around the highlighted element
const EDGE = 12; // px kept clear of the screen edges
const ARROW_GAP = 16; // px between the highlight and the tooltip (room for the arrow)
const SETTLE_MS = 160; // the target must hold still this long before the tooltip shows
// Where the first dish lands on the browse step: just under the compact bar.
const BROWSE_TOP = 214;

type Rect = { top: number; left: number; width: number; height: number };

function unionRect(boxes: DOMRect[]): Rect {
  const top = Math.min(...boxes.map((b) => b.top));
  const left = Math.min(...boxes.map((b) => b.left));
  const bottom = Math.max(...boxes.map((b) => b.bottom));
  const right = Math.max(...boxes.map((b) => b.right));
  return { top, left, width: right - left, height: bottom - top };
}

const sameRect = (a: Rect | null, b: Rect | null) =>
  !!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;

// Dims the screen except the current step's element and points a tooltip at
// it. Blocks the app underneath: the tour drives every screen change itself,
// so the only controls are Next / Finish and Skip tour.
export function TourOverlay() {
  const tour = useTour();
  const step = tour.step;
  const [rect, setRect] = useState<Rect | null>(null);
  const [settled, setSettled] = useState(false);
  const [tipHeight, setTipHeight] = useState(190);
  const tipRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Follow the target every frame: sheets slide in, pages change, the menu
  // scrolls. The tooltip waits until it has stopped moving.
  useEffect(() => {
    if (!step) return;
    setRect(null);
    setSettled(false);
    let frame = 0;
    let last: Rect | null = null;
    let stillSince = 0;
    let scrolled = false;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      // The target may match several elements (e.g. a button and its open
      // menu): highlight the area covering all of them.
      const els = [...document.querySelectorAll(step.target)].filter((e) => e.getBoundingClientRect().width > 0);
      const el = els[0];
      const box = els.length ? unionRect(els.map((e) => e.getBoundingClientRect())) : undefined;
      if (!box || box.width === 0) {
        if (last) setRect((last = null));
        stillSince = 0;
        return;
      }
      if (step.id === "browse" && !scrolled) {
        scrolled = true;
        window.scrollTo({ top: box.top + window.scrollY - BROWSE_TOP, behavior: "smooth" });
      } else if (step.scroll && !scrolled) {
        scrolled = true;
        el!.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      const next = {
        top: Math.round(box.top),
        left: Math.round(box.left),
        width: Math.round(box.width),
        height: Math.round(box.height),
      };
      if (!sameRect(last, next)) {
        setRect((last = next));
        stillSince = now;
      } else if (stillSince && now - stillSince > SETTLE_MS) {
        setSettled(true);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [step]);

  // Keep the page from scrolling under the tour, and let Escape skip it
  // (before any open sheet hears Escape and closes itself).
  useEffect(() => {
    if (!step) return;
    const root = rootRef.current;
    const block = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      tour.end();
    };
    root?.addEventListener("wheel", block, { passive: false });
    root?.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", onKey, true);
    return () => {
      root?.removeEventListener("wheel", block);
      root?.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [step, tour]);

  useEffect(() => {
    const tip = tipRef.current;
    if (!tip) return;
    const observer = new ResizeObserver(() => setTipHeight(tip.offsetHeight));
    observer.observe(tip);
    return () => observer.disconnect();
  });

  if (!step) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const need = tipHeight + ARROW_GAP + EDGE;

  // The highlight, kept on screen. If the tooltip fits on neither side (a
  // tall element), the highlight is cut short so it fits underneath.
  let spot: Rect | null = null;
  let below = step.placement === "below";
  if (rect) {
    const top = Math.max(EDGE, rect.top - SPOT_PAD);
    let bottom = Math.min(vh - EDGE, rect.top + rect.height + SPOT_PAD);
    const fitsBelow = vh - bottom >= need;
    const fitsAbove = top >= need;
    if (below ? !fitsBelow : !fitsAbove) below = below ? !fitsAbove : fitsBelow;
    if (!fitsBelow && !fitsAbove) {
      below = true;
      bottom = Math.max(top + 80, vh - need);
    }
    spot = { top, left: Math.max(EDGE / 2, rect.left - SPOT_PAD), width: 0, height: bottom - top };
    spot.width = Math.min(vw - EDGE / 2, rect.left + rect.width + SPOT_PAD) - spot.left;
  }

  const tipWidth = Math.min(326, vw - 32);
  const centerX = spot ? spot.left + spot.width / 2 : vw / 2;
  const tipLeft = Math.min(Math.max(16, centerX - tipWidth / 2), vw - tipWidth - 16);
  const tipTop = spot ? (below ? spot.top + spot.height + ARROW_GAP : spot.top - ARROW_GAP - tipHeight) : 0;
  const arrowLeft = Math.min(Math.max(28, centerX - tipLeft), tipWidth - 28);
  const last = tour.index === tour.steps.length - 1;

  return (
    <div ref={rootRef} className="fixed inset-0 z-[100] touch-none" role="presentation">
      {/* Swallows taps on the app underneath. */}
      <div className="absolute inset-0" />
      {spot ? (
        <div
          aria-hidden="true"
          style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
          className="pointer-events-none absolute rounded-[18px] shadow-[0_0_0_200vmax_rgba(20,10,30,0.55)]"
        />
      ) : (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[rgba(20,10,30,0.55)]" />
      )}

      <div
        ref={tipRef}
        key={step.id}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        style={{ top: tipTop, left: tipLeft, width: tipWidth }}
        className={`absolute flex flex-col gap-2.5 rounded-[20px] bg-plum p-[18px] shadow-[0_8px_28px_rgba(0,0,0,0.30)] transition-opacity duration-200 ${
          spot && settled ? "animate-toast-in opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span
          aria-hidden="true"
          style={{ left: arrowLeft }}
          className={`absolute h-[18px] w-[18px] -translate-x-1/2 rotate-45 bg-plum ${below ? "-top-[8px]" : "-bottom-[8px]"}`}
        />
        <div className="relative flex items-center justify-between">
          <span className="text-[11.5px] font-bold uppercase tracking-[1.2px] text-white/90">
            Step {tour.index + 1} of {tour.steps.length}
          </span>
          <button type="button" onClick={tour.end} className="-m-2 p-2 text-xs font-semibold text-white/50">
            Skip tour
          </button>
        </div>
        <h2 id="tour-title" className="relative text-[17px] font-bold leading-tight text-white">
          {step.title}
        </h2>
        <p id="tour-body" className="relative text-[13.5px] font-medium leading-[1.4] text-white/75">
          {step.body}
        </p>
        <div className="relative flex items-center justify-between pt-1">
          <div className="flex items-center gap-[5px]" aria-hidden="true">
            {tour.steps.map((s, i) => (
              <span
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === tour.index ? "w-3.5 bg-white" : "w-1.5 bg-white/25"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {tour.index > 0 && (
              <button
                type="button"
                onClick={tour.back}
                className="rounded-full px-3.5 py-2.5 text-sm font-bold leading-none text-white/80 ring-1 ring-inset ring-white/30 transition active:scale-95"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={tour.next}
              autoFocus
              className="rounded-full bg-white px-[18px] py-2.5 text-sm font-bold leading-none text-plum transition active:scale-95"
            >
              {last ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
