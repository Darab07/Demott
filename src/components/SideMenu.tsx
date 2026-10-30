import type { ReactNode } from "react";
import { restaurant } from "../lib/menu";
import { useOverlay } from "../lib/useOverlay";
import { Photo } from "./Photo";
import {
  AtSignIcon,
  ChevronRightIcon,
  CompassIcon,
  HomeIcon,
  InstagramIcon,
  LinkIcon,
  LinkedInIcon,
  WhatsAppIcon,
  XIcon,
} from "./icons";

// Slide-in drawer opened from the ☰ button. Stays mounted so it can animate
// both ways; `invisible` (delayed by the transition) keeps it out of the tab
// order once closed.
export function SideMenu({
  open,
  onClose,
  onStartTour,
  onChooseDemo,
}: {
  open: boolean;
  onClose: () => void;
  onStartTour?: () => void; // dine-in only: replays the guided tour
  onChooseDemo?: () => void; // back to the "Pick a demo" page
}) {
  useOverlay(open, onClose);

  return (
    <div
      className={`fixed inset-0 z-50 mx-auto max-w-phone transition-[visibility] duration-300 ${
        open ? "visible" : "invisible"
      }`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${restaurant.name} menu`}
        className={`absolute inset-y-0 left-0 flex w-[301px] max-w-[80%] flex-col overflow-y-auto rounded-r-[17px] bg-[#d9d9d9] px-[11px] pt-[calc(env(safe-area-inset-top)+49px)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col items-center">
          <div className="h-[85px] w-[85px] overflow-hidden rounded-full border border-icon-muted bg-white p-2">
            <Photo src={restaurant.logo} alt={`${restaurant.name} logo`} className="h-full w-full !bg-transparent" />
          </div>
          <h2 className="mt-3.5 text-[30px] font-bold leading-none">{restaurant.name}</h2>
          <div className="mt-[26px] flex items-center gap-[14.5px]">
            <SocialButton label="LinkedIn">
              <LinkedInIcon className="h-[21px] w-[21px]" />
            </SocialButton>
            <SocialButton label="Instagram">
              <InstagramIcon className="h-[21px] w-[21px]" />
            </SocialButton>
            <SocialButton label="WhatsApp">
              <WhatsAppIcon className="h-[21px] w-[21px]" />
            </SocialButton>
            <SocialButton label="X">
              <XIcon className="h-[19px] w-[19px]" />
            </SocialButton>
          </div>
        </div>

        <div className="relative mt-[33px] h-[129px] shrink-0">
          <div className="absolute inset-0 overflow-hidden rounded-3xl bg-[rgba(208,209,177,0.93)]">
            <div className="absolute left-4 top-6 flex w-[112px] flex-col items-start gap-[15px]">
              <p className="w-[101px] text-base font-medium leading-[1.03] text-black">Join our Boathouse Club!</p>
              <button
                type="button"
                className="rounded-full bg-black/[0.07] px-[15px] py-2.5 text-base font-medium leading-none text-black"
              >
                Sign In
              </button>
            </div>
            <Photo
              src={restaurant.loyaltyImage}
              alt=""
              className="absolute inset-y-0 left-[154px] w-[142px] !bg-transparent"
            />
          </div>
          <span className="absolute -top-[15px] left-[30px] rounded-full bg-[#09385f] px-[19px] py-2.5 text-xs font-medium leading-none text-white">
            Loyalty
          </span>
        </div>

        <nav className="mt-[21px] flex flex-col gap-[25px]">
          <DrawerLink icon={<AtSignIcon className="h-6 w-6" />} label="Website" />
          <DrawerLink icon={<LinkIcon className="h-6 w-6" />} label="Our Products" />
          {onStartTour && (
            <DrawerLink icon={<CompassIcon className="h-6 w-6" />} label="Take the tour" onClick={onStartTour} />
          )}
          {onChooseDemo && (
            <DrawerLink icon={<HomeIcon className="h-6 w-6" />} label="Choose another demo" onClick={onChooseDemo} />
          )}
        </nav>

        <p className="mt-auto flex items-center justify-center gap-2 pb-[calc(env(safe-area-inset-bottom)+40px)] pt-10 text-sm font-bold leading-none text-ink-muted">
          Powered by
          {/* Stand-in for the "Tt" TableTap mark until its SVG is exported. */}
          <span className="text-[24px] font-black leading-none tracking-[-0.08em] text-plum">
            Tt<span className="text-[10px]">.</span>
          </span>
        </p>
      </aside>
    </div>
  );
}

function SocialButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} className="text-black transition active:scale-90">
      {children}
    </button>
  );
}

function DrawerLink({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center justify-between text-left">
      <span className="flex items-center gap-[15px]">
        {icon}
        <span className="text-xl font-bold leading-none">{label}</span>
      </span>
      <ChevronRightIcon className="h-6 w-6" strokeWidth={2} />
    </button>
  );
}
