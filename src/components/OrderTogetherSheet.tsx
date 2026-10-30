import { useEffect, useState } from "react";
import { inviteUrl, restaurant } from "../lib/menu";
import { guests } from "../lib/table";
import { useDragToDismiss } from "../lib/useDragToDismiss";
import { copyText } from "../lib/clipboard";
import { useOverlay } from "../lib/useOverlay";
import { QrCode } from "./QrCode";
import { CloseIcon, CopyIcon, ShareOutIcon, UsersIcon } from "./icons";

// Bottom sheet opened from the people button: invite others at the table to
// add to the same bill.
export function OrderTogetherSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  useOverlay(open, onClose);
  const [copied, setCopied] = useState(false);
  const fullUrl = `https://${inviteUrl}`;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyLink = async () => {
    if (await copyText(fullUrl)) setCopied(true);
  };

  const shareLink = async () => {
    const data = {
      title: `Join Table #${restaurant.table} at ${restaurant.name}`,
      text: `Add your order to our table at ${restaurant.name}`,
      url: fullUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (err) {
        if ((err as DOMException).name === "AbortError") return; // user cancelled
      }
    }
    // No share sheet (desktop, or a non-https page): copy instead.
    await copyLink();
  };

  // Drag the handle/header down to dismiss.
  const drag = useDragToDismiss(onClose);

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
        aria-labelledby="order-together-title"
        style={drag.style}
        className={`absolute inset-x-0 bottom-0 flex max-h-[calc(100dvh-40px)] flex-col overflow-y-auto rounded-t-[28px] bg-white px-6 pb-[calc(env(safe-area-inset-bottom)+34px)] shadow-[0_-10px_40px_rgba(0,0,0,0.18)] ${
          drag.dragging ? "" : "transition-transform duration-300 ease-out"
        } ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        <div
          {...drag.handlers}
          className="touch-none pt-3"
        >
          <div className="mx-auto h-[5px] w-10 rounded-[3px] bg-ink/15" />
          <div className="mt-4 flex items-start justify-between gap-3">
            <div className="flex flex-col gap-[3px]">
              <h2 id="order-together-title" className="text-xl font-bold leading-tight">
                Order together
              </h2>
              <p className="text-[13.5px] font-medium text-ink-muted">
                Everyone at Table #{restaurant.table} adds to one bill
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Close"
              className="shrink-0 rounded-full bg-ink/5 p-2"
            >
              <CloseIcon className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </button>
          </div>
        </div>

        <div data-tour="table-qr" className="mt-4 flex flex-col items-center gap-3 rounded-[22px] bg-cream p-5 ring-1 ring-inset ring-hairline">
          <div className="rounded-2xl bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <QrCode value={fullUrl} className="h-[150px] w-[150px] text-ink" />
          </div>
          <p className="text-[13px] font-medium text-ink-muted">Scan to join this table</p>
          <p className="flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-inset ring-hairline">
            <span className="text-[13px] font-medium text-ink-muted">Table {restaurant.table} · code</span>
            <span className="text-lg font-bold tracking-[0.2em]">{restaurant.tableCode}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={shareLink}
          className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-full bg-black py-4 text-[17px] font-medium text-white transition active:scale-[0.98]"
        >
          <ShareOutIcon className="h-5 w-5" />
          Share invite link
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="mx-auto mt-3 flex items-center gap-1.5 text-[13px] font-medium text-ink-muted"
        >
          <CopyIcon className="h-3.5 w-3.5" />
          {copied ? "Link copied" : `Copy ${inviteUrl}`}
        </button>

        <div className="mt-4 border-t border-hairline pt-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.04em] text-ink-muted">
            <UsersIcon className="h-3.5 w-3.5" />
            At this table · {guests.length}
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {guests.map((guest) => (
              <li key={guest.id} className="flex items-center gap-3.5">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-bold ${
                    guest.isYou ? "bg-plum text-white" : "bg-ink/5 text-ink-muted"
                  }`}
                >
                  {guest.initial}
                </span>
                <span className="flex-1 text-[15px] font-bold">
                  {guest.name}
                  {guest.isYou && <span className="ml-1 text-xs font-medium text-ink-muted">· you</span>}
                </span>
                {guest.joined && (
                  <span className="rounded-full bg-plum/10 px-2 py-0.5 text-xs font-bold text-plum">joined</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
