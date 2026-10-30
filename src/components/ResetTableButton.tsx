import { useEffect, useRef, useState } from "react";
import { resetDemo } from "../lib/demo";
import { ResetIcon } from "./icons";

// Round floating button (bottom right of the menu) that resets the demo, with
// a small confirmation so a stray tap mid-demo doesn't wipe it. Defaults are
// the dine-in table's; the Curbside / Pickup menu passes its own.
export function ResetTableButton({
  bottom,
  title = "Reset the table?",
  body = "Clears your order and all payments so the demo starts from the beginning.",
  label = "Reset table",
  onReset = resetDemo,
}: {
  bottom: string;
  title?: string;
  body?: string;
  label?: string;
  onReset?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Tap anywhere else to cancel.
  useEffect(() => {
    if (!confirming) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setConfirming(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [confirming]);

  return (
    <div
      ref={rootRef}
      style={{ bottom }}
      className="pointer-events-none fixed inset-x-0 z-30 mx-auto flex max-w-phone justify-end px-[25px] transition-[bottom] duration-200"
    >
      <div className="pointer-events-auto relative">
        {confirming && (
          <div
            role="alertdialog"
            aria-label={title}
            className="absolute bottom-[calc(100%+10px)] right-0 w-60 animate-toast-in rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.15)] ring-1 ring-hairline"
          >
            <p className="text-base font-bold leading-tight">{title}</p>
            <p className="mt-1 text-sm font-medium leading-snug text-ink-muted">{body}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="h-10 flex-1 rounded-full bg-ink/5 text-sm font-bold"
              >
                Cancel
              </button>
              <button type="button" onClick={onReset} className="h-10 flex-1 rounded-full bg-black text-sm font-bold text-white">
                Reset
              </button>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setConfirming((c) => !c)}
          aria-label={label}
          aria-expanded={confirming}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)] ring-1 ring-inset ring-hairline transition active:scale-90"
        >
          <ResetIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
