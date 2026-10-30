import { useTour } from "../lib/tour";
import { CompassIcon } from "./icons";

// Round floating button (above the reset button on the menu) that replays
// the guided tour.
export function TourButton({ bottom }: { bottom: string }) {
  const tour = useTour();
  return (
    <div
      style={{ bottom }}
      className="pointer-events-none fixed inset-x-0 z-30 mx-auto flex max-w-phone justify-end px-[25px] transition-[bottom] duration-200"
    >
      <button
        type="button"
        onClick={tour.start}
        aria-label="Take the tour"
        className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)] ring-1 ring-inset ring-hairline transition active:scale-90"
      >
        <CompassIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
