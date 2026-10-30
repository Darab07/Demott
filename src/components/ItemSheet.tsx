import { useEffect, useState } from "react";
import type { LineChoice } from "../lib/cart";
import { tapFeedback } from "../lib/haptics";
import {
  firstMissingRequired,
  formatAmount,
  unitPrice,
  type MenuItem,
  type OptionGroup,
  type Selections,
} from "../lib/menu";
import { useDragToDismiss } from "../lib/useDragToDismiss";
import { useOverlay } from "../lib/useOverlay";
import { Photo } from "./Photo";
import { Tag } from "./Tag";
import { CheckIcon, CloseIcon, MinusIcon, PlusIcon } from "./icons";

const EMPTY_CHOICE: LineChoice = { selections: {}, note: "", qty: 1 };

// Full-height sheet for one dish: options, a note, quantity, and "Add to
// order". Pass `initial` to edit an existing order line instead ("Update
// order"), or `prefill` to start a new line with choices already made (the
// guided tour). `item` stays set while closing so the slide-out still has content.
export function ItemSheet({
  item,
  open,
  initial,
  prefill,
  onClose,
  onSubmit,
}: {
  item: MenuItem | null;
  open: boolean;
  initial?: LineChoice;
  prefill?: LineChoice;
  onClose: () => void;
  onSubmit: (item: MenuItem, choice: LineChoice) => void;
}) {
  useOverlay(open, onClose);
  // Swipe down anywhere on the card (while it's scrolled to the top) to close.
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const drag = useDragToDismiss(onClose, scrollEl);

  const [selections, setSelections] = useState<Selections>({});
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);
  // Bumped on each tap of Add while a required choice is missing, to replay
  // the nudge on its "Required" badge.
  const [nudges, setNudges] = useState(0);

  // Fresh form each time a dish is opened (or the line being edited).
  useEffect(() => {
    if (!open || !item) return;
    const start = initial ?? prefill ?? EMPTY_CHOICE;
    setSelections(start.selections);
    setNote(start.note);
    setQty(start.qty);
    setNudges(0);
  }, [open, item, initial, prefill]);

  const toggle = (group: OptionGroup, choiceId: string) =>
    setSelections((prev) => {
      if (group.required) return { ...prev, [group.id]: [choiceId] };
      const current = prev[group.id] ?? [];
      return {
        ...prev,
        [group.id]: current.includes(choiceId) ? current.filter((id) => id !== choiceId) : [...current, choiceId],
      };
    });

  const total = item ? unitPrice(item, selections) * qty : 0;
  const missing = item ? firstMissingRequired(item, selections) : undefined;
  const editing = !!initial;

  const submit = () => {
    if (!item) return;
    if (missing) {
      // Point at what still needs choosing instead of adding.
      setNudges((n) => n + 1);
      tapFeedback([10, 40, 10]);
      document.getElementById(`group-${missing.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onSubmit(item, { selections, note, qty });
  };

  return (
    <div
      className={`fixed inset-0 z-50 mx-auto max-w-phone transition-[visibility] duration-300 ${
        open ? "visible" : "invisible"
      }`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={item?.name}
        style={drag.style}
        className={`absolute inset-x-0 bottom-0 top-[50px] flex flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.18)] ${
          drag.dragging ? "" : "transition-transform duration-300 ease-out"
        } ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        {item && (
          <>
            <div ref={setScrollEl} className="flex-1 overflow-y-auto overscroll-contain">
              <div className="relative h-[222px]">
                <Photo src={item.image} alt={item.name} className="h-full w-full" />
                <div className="absolute left-1/2 top-3 h-[5px] w-10 -translate-x-1/2 rounded-[3px] bg-white/85" />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                >
                  <CloseIcon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex flex-col gap-3.5 px-5 pb-5 pt-[18px]">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold leading-tight">{item.name}</h2>
                  <p className="shrink-0 text-[19px] font-bold">PKR {formatAmount(item.price)}</p>
                </div>
                {item.tag && <Tag tag={item.tag} compact />}
                <p className="text-sm font-medium leading-[1.35] text-ink-muted">{item.description}</p>
                <div className="h-px bg-hairline" />

                {item.options && (
                  <div data-tour="dish-options" className="flex flex-col gap-3.5">
                    {item.options.map((group) => (
                      <div key={group.id} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <h3 id={`group-${group.id}`} className="text-[15.5px] font-bold">
                            {group.name}
                          </h3>
                          <span
                            key={missing?.id === group.id ? nudges : undefined}
                            className={`rounded-lg px-[9px] py-1 text-[11px] font-semibold tracking-[0.03em] transition-colors ${
                              missing?.id === group.id && nudges > 0
                                ? "animate-nudge bg-plum text-white motion-reduce:animate-none"
                                : "bg-ink/5 text-ink/55"
                            }`}
                          >
                            {group.required ? "Required" : "Optional"}
                          </span>
                        </div>
                        <div
                          role={group.required ? "radiogroup" : "group"}
                          aria-labelledby={`group-${group.id}`}
                          className="flex flex-col gap-0.5"
                        >
                          {group.choices.map((choice) => {
                            const checked = selections[group.id]?.includes(choice.id) ?? false;
                            return (
                              <button
                                key={choice.id}
                                type="button"
                                role={group.required ? "radio" : "checkbox"}
                                aria-checked={checked}
                                onClick={() => toggle(group, choice.id)}
                                className="flex items-center gap-2.5 py-1 text-left"
                              >
                                <span className="flex-1 text-[15px] font-medium text-ink/85">{choice.name}</span>
                                {choice.price ? (
                                  <span className="text-[13.5px] font-semibold text-ink/50">
                                    +PKR {formatAmount(choice.price)}
                                  </span>
                                ) : null}
                                {group.required ? <Radio checked={checked} /> : <Checkbox checked={checked} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={140}
                  placeholder="Add a note — e.g. no chilli butter"
                  className="w-full rounded-2xl bg-cream px-4 py-3.5 text-base font-medium outline-none ring-1 ring-inset ring-hairline placeholder:text-ink/45 focus:ring-ink/40"
                />
              </div>
            </div>

            <footer className="flex items-center gap-3 bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+26px)] pt-3.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 rounded-full px-3 py-[9px] ring-1 ring-inset ring-hairline">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty === 1}
                  aria-label="One fewer"
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-full transition disabled:opacity-30"
                >
                  <MinusIcon className="h-[18px] w-[18px]" />
                </button>
                <span className="min-w-[1ch] text-center text-base font-bold" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="One more"
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-plum text-white transition active:scale-90"
                >
                  <PlusIcon className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
              </div>
              <button
                type="button"
                onClick={submit}
                aria-disabled={!!missing}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full py-[17px] text-base text-white transition active:scale-[0.98] ${
                  missing ? "bg-black/35" : "bg-black"
                }`}
              >
                {missing ? (
                  <span className="font-medium">{missing.prompt ?? `Choose ${missing.name.toLowerCase()}`}</span>
                ) : (
                  <>
                    <span className="font-medium">{editing ? "Update order" : "Add to order"}</span>
                    <span className="font-bold">· PKR {formatAmount(total)}</span>
                  </>
                )}
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

function Radio({ checked }: { checked: boolean }) {
  return checked ? (
    <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-ink">
      <span className="h-2 w-2 rounded-full bg-white" />
    </span>
  ) : (
    <span className="h-[22px] w-[22px] shrink-0 rounded-full border-[1.6px] border-ink/30 bg-white" />
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return checked ? (
    <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] bg-ink text-white">
      <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
    </span>
  ) : (
    <span className="h-[22px] w-[22px] shrink-0 rounded-[7px] border-[1.6px] border-ink/30 bg-white" />
  );
}
