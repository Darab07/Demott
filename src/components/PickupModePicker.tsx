import { useEffect, useRef, useState } from "react";
import { tapFeedback } from "../lib/haptics";
import { pickupModes, setPickupMode, usePickupMode, type PickupMode } from "../lib/pickup";
import { BagIcon, CarIcon, CheckIcon, ChevronDownIcon } from "./icons";

export const modeIcon = (mode: PickupMode, className: string) =>
  mode === "curbside" ? <CarIcon className={className} /> : <BagIcon className={className} />;

// "Pickup ▾" pill: choose between collecting at the counter and having the
// order brought out to the car.
// `align` picks which edge the dropdown lines up with; `forceOpen` holds it
// open (the guided tour shows both choices).
export function PickupModePicker({ align = "left", forceOpen = false }: { align?: "left" | "right"; forceOpen?: boolean }) {
  const mode = usePickupMode();
  const [openState, setOpen] = useState(false);
  const open = openState || forceOpen;
  const rootRef = useRef<HTMLDivElement>(null);
  const current = pickupModes.find((m) => m.id === mode)!;

  // Tap anywhere else, or Escape, to close.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Order type: ${current.name}`}
        className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 ring-1 ring-inset ring-hairline transition active:scale-[0.97]"
      >
        {modeIcon(mode, "h-[18px] w-[18px] shrink-0")}
        <span className="whitespace-nowrap text-[15px] font-bold leading-none">{current.name}</span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          data-tour="pickup-mode-menu"
          aria-label="Order type"
          className={`absolute ${align === "right" ? "right-0" : "left-0"} top-[calc(100%+8px)] z-50 w-[250px] animate-toast-in rounded-2xl bg-white p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.15)] ring-1 ring-hairline`}
        >
          {pickupModes.map((option) => {
            const selected = option.id === mode;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    tapFeedback();
                    setPickupMode(option.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    selected ? "bg-plum/[0.07]" : "active:bg-ink/5"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      selected ? "bg-plum text-white" : "bg-ink/5"
                    }`}
                  >
                    {modeIcon(option.id, "h-[18px] w-[18px]")}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[15px] font-bold leading-tight">{option.name}</span>
                    <span className="text-[13px] font-medium leading-tight text-ink-muted">{option.description}</span>
                  </span>
                  {selected && <CheckIcon className="h-4 w-4 shrink-0 text-plum" strokeWidth={2.4} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Pickup | Curbside segmented control, on the order and checkout screens.
export function PickupModeToggle({ className = "" }: { className?: string }) {
  const mode = usePickupMode();
  return (
    <div role="radiogroup" aria-label="Order type" className={`flex gap-1 rounded-[26px] bg-ink/5 p-1 ${className}`}>
      {pickupModes.map((option) => {
        const selected = option.id === mode;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              if (selected) return;
              tapFeedback();
              setPickupMode(option.id);
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-[22px] py-3 text-[15px] leading-none transition-[background-color,box-shadow] duration-200 ${
              selected ? "bg-white font-bold shadow-[0_2px_6px_rgba(0,0,0,0.08)]" : "font-medium text-ink-muted"
            }`}
          >
            {modeIcon(option.id, "h-[18px] w-[18px] shrink-0 text-ink")}
            {option.name}
          </button>
        );
      })}
    </div>
  );
}
