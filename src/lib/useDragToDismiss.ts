import { useEffect, useRef, useState, type PointerEvent } from "react";

const DISMISS_DRAG_PX = 100;
const DISMISS_FLICK_PX_PER_MS = 0.4; // a quick flick closes even if short

// Swipe a bottom sheet downwards to close it; short, slow drags spring back.
// Apply `style` to the sheet (and drop its transition while `dragging`).
//
// Two ways to grab it:
// - `handlers`: spread on a dedicated grab area (handle/header).
// - `scrollEl`: the sheet's scrolling body. Pulling down while it is
//   scrolled to the top drags the sheet; otherwise it scrolls as normal.
//   (An element rather than a ref so the listeners attach once it mounts.)
export function useDragToDismiss(onClose: () => void, scrollEl?: HTMLElement | null) {
  const [dragY, setDragYState] = useState(0);
  const dragYRef = useRef(0);
  const setDragY = (y: number) => {
    dragYRef.current = y;
    setDragYState(y);
  };

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Last two samples, for release velocity.
  const track = useRef<{ startY: number; lastY: number; lastT: number; velocity: number } | null>(null);

  const begin = (y: number) => {
    track.current = { startY: y, lastY: y, lastT: performance.now(), velocity: 0 };
  };
  const move = (y: number) => {
    const t = track.current;
    if (!t) return;
    const now = performance.now();
    t.velocity = (y - t.lastY) / Math.max(1, now - t.lastT);
    t.lastY = y;
    t.lastT = now;
    setDragY(Math.max(0, y - t.startY));
  };
  const end = () => {
    const t = track.current;
    if (!t) return;
    track.current = null;
    const pulled = dragYRef.current;
    if (pulled > DISMISS_DRAG_PX || (pulled > 10 && t.velocity > DISMISS_FLICK_PX_PER_MS)) onCloseRef.current();
    setDragY(0);
  };

  // Body drag uses native touch listeners: the move handler has to be
  // non-passive to stop the page scrolling while the sheet follows the finger.
  useEffect(() => {
    const el = scrollEl;
    if (!el) return;
    let startY = 0;
    let armed = false; // touch began with the body scrolled to the top
    let dragging = false;

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      armed = el.scrollTop <= 0;
      dragging = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!armed) return;
      const y = e.touches[0].clientY;
      if (!dragging) {
        if (y - startY > 4 && el.scrollTop <= 0) {
          dragging = true;
          begin(startY);
        } else if (y < startY) {
          armed = false; // scrolling up into the content instead
          return;
        } else {
          return;
        }
      }
      e.preventDefault();
      move(y);
    };
    const onTouchEnd = () => {
      if (dragging) end();
      armed = dragging = false;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [scrollEl]);

  return {
    dragging: dragY > 0,
    style: dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined,
    handlers: {
      onPointerDown: (e: PointerEvent) => {
        begin(e.clientY);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      },
      onPointerMove: (e: PointerEvent) => move(e.clientY),
      onPointerUp: end,
      onPointerCancel: end,
    },
  };
}
