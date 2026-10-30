import { useEffect, useRef, useState, type MouseEvent } from "react";
import { PlusIcon } from "./icons";

// Purple button over a dish photo; `className` positions it.
// Shows + until the dish is in the order, then a tick (with a count bubble
// from 2 up) for as long as it stays there. It pops each time the count goes
// up. What a press does is the parent's call (`onPress`).
export function AddButton({
  name,
  count,
  onPress,
  className,
}: {
  name: string;
  count: number;
  onPress: () => void;
  className: string;
}) {
  const added = count > 0;

  // Re-key the pop animation whenever the count rises.
  const [pops, setPops] = useState(0);
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current) setPops((n) => n + 1);
    prevCount.current = count;
  }, [count]);

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation(); // don't also trigger the row behind it
    onPress();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={added ? `${name}, ${count} in your order` : `Add ${name}`}
      className={`absolute rounded-full transition-transform active:scale-90 ${className}`}
    >
      <span
        key={pops}
        className={`relative block rounded-full bg-plum p-[3px] text-white ring-[1.7px] ring-inset ring-black/5 ${
          pops > 0 ? "animate-pop motion-reduce:animate-none" : ""
        }`}
      >
        <PlusIcon
          className={`h-[18px] w-[18px] transition duration-200 motion-reduce:transition-none ${
            added ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`absolute inset-[3px] h-[18px] w-[18px] transition-opacity duration-150 ${
            added ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Drawn on by animating the dash offset from full length to 0. */}
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={added ? 0 : 1}
            className="transition-[stroke-dashoffset] delay-100 duration-300 ease-out motion-reduce:transition-none"
          />
        </svg>
      </span>
      {count > 1 && (
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold leading-none text-plum shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
        >
          {count}
        </span>
      )}
    </button>
  );
}
