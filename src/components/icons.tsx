// Line icons drawn to match the Figma. All use a 24px grid and currentColor;
// size them with className.
import type { ReactNode } from "react";

type IconProps = { className?: string; strokeWidth?: number };

function Icon({ className, strokeWidth = 1.8, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export function QrIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </Icon>
  );
}

export function CarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 8l-2 2-1.5-3.7A2 2 0 0 0 15.65 5H8.4a2 2 0 0 0-1.9 1.26L5 10 3 8" />
      <rect x="3" y="10" width="18" height="8" rx="2" />
      <path d="M7 14h.01M17 14h.01" />
      <path d="M5 18v2M19 18v2" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 6l6 6-6 6" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Icon>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95L12 2.5z" />
    </Icon>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 10c0 5-5.54 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.2 4 15 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M17 7L7 17M7 7l10 10" />
    </Icon>
  );
}

// Union Jack for the language picker (full colour, not currentColor).
export function UkFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="none" aria-hidden="true" className={className}>
      <clipPath id="uk-flag-diagonals">
        <path d="M30 15h30v15zv15H0zH0V0zV0h30z" />
      </clipPath>
      <path d="M0 0v30h60V0z" fill="#012169" />
      <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0l60 30m0-30L0 30" clipPath="url(#uk-flag-diagonals)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2.4} {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"
      />
    </Icon>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </Icon>
  );
}

export function AtSignIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
    </Icon>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Icon>
  );
}

// Social brand marks (solid black in the design).
export function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect x="1" y="1" width="22" height="22" rx="3" fill="currentColor" />
      <g fill="#fff">
        <circle cx="7" cy="6.8" r="1.7" />
        <rect x="5.5" y="9.5" width="3" height="9" />
        <path d="M10.5 9.5h2.9v1.3c.5-.9 1.6-1.5 3-1.5 2.6 0 3.1 1.7 3.1 3.9v5.3h-3v-4.7c0-1.1-.1-2.1-1.4-2.1s-1.6 1-1.6 2v4.8h-3z" />
      </g>
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2} {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </Icon>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z" />
      <path
        fill="currentColor"
        stroke="none"
        d="M8.5 7.2c-.4.4-.9 1.3-.6 2.5.6 2.2 3.3 4.9 5.5 5.6 1.1.3 2 0 2.5-.5l.6-.9-2.3-1.3-1 .8c-1-.4-2.2-1.6-2.7-2.7l.8-1-1.3-2.3z"
      />
    </Icon>
  );
}

export function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zM17.61 20.64h2.04L6.49 3.24H4.3z" />
    </svg>
  );
}

export function ShareOutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" />
      <path d="M10 12h11M17 8l4 4-4 4" />
    </Icon>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="8" y="8" width="14" height="14" rx="2" />
      <path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" />
    </Icon>
  );
}

export function PakistanFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={className}>
      <rect width="30" height="20" fill="#01411c" />
      <rect width="7.5" height="20" fill="#fff" />
      <circle cx="18.75" cy="10" r="6" fill="#fff" />
      <circle cx="20.3" cy="8.6" r="5.4" fill="#01411c" />
      <path
        fill="#fff"
        d="M23.35 5.75L23.06 7.10L24.26 7.80L22.89 7.94L22.60 9.29L22.04 8.03L20.66 8.17L21.69 7.25L21.13 5.99L22.32 6.68z"
      />
    </svg>
  );
}

export function ChinaFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={className}>
      <rect width="30" height="20" fill="#ee1c25" />
      <g fill="#ffde00">
        <path d="M5.00 2.00L5.67 4.07L7.85 4.07L6.09 5.35L6.76 7.43L5.00 6.15L3.24 7.43L3.91 5.35L2.15 4.07L4.33 4.07z" />
        <path d="M9.14 2.51L9.62 1.97L9.25 1.34L9.91 1.63L10.39 1.08L10.33 1.80L11.00 2.09L10.29 2.25L10.22 2.97L9.85 2.35z" />
        <path d="M11.01 4.14L11.66 3.82L11.56 3.10L12.07 3.62L12.72 3.30L12.38 3.95L12.88 4.47L12.17 4.34L11.83 4.99L11.73 4.27z" />
        <path d="M11.04 6.73L11.76 6.70L11.96 6.00L12.21 6.68L12.94 6.66L12.37 7.10L12.62 7.79L12.01 7.38L11.44 7.83L11.64 7.13z" />
        <path d="M9.22 8.38L9.90 8.63L10.35 8.06L10.32 8.79L11.00 9.05L10.30 9.24L10.26 9.96L9.87 9.36L9.16 9.55L9.62 8.98z" />
      </g>
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2.2} {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 6l-6 6 6 6" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9l6 6 6-6" />
    </Icon>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2.2} {...props}>
      <path d="M5 12h14" />
    </Icon>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </Icon>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 6h12M9 12h12M9 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth={3} />
    </Icon>
  );
}

export function PieChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </Icon>
  );
}

export function PercentIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path d="M19 5L5 19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.5} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </Icon>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2} {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </Icon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.5} {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Icon>
  );
}

export function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path d="M5 2.5h10a.83.83 0 0 1 .83.83V17.5l-5.83-3.33L4.17 17.5V3.33A.83.83 0 0 1 5 2.5z" fill="currentColor" />
      <path d="M7.5 8.33l1.67 1.67 3.33-3.33" fill="none" stroke="black" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.8 4.5c2.2 0 3.6 1.2 5.2 3 1.6-1.8 3-3 5.2-3 3.8 0 5.9 3.8 4.4 7.2C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <path d="M16 6l-4-4-4 4M12 2v13" />
    </Icon>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9v10.5a1.5 1.5 0 0 0 1.5 1.5H10v-6h4v6h3.5a1.5 1.5 0 0 0 1.5-1.5V9" />
    </Icon>
  );
}

export function BagIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 7h14l-1 13a1.5 1.5 0 0 1-1.5 1.4h-9A1.5 1.5 0 0 1 6 20z" />
      <path d="M9 10.5a3 3 0 0 0 6 0" />
      <path d="M9 7V6a3 3 0 0 1 6 0v1" />
    </Icon>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </Icon>
  );
}

export function ResetIcon(props: IconProps) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </Icon>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 5 5.5v5.8c0 4.3 2.9 7.9 7 9.2 4.1-1.3 7-4.9 7-9.2V5.5z" />
      <path d="m9.5 12 1.8 1.8 3.4-3.6" />
    </Icon>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M16.5 7V4.8a1.3 1.3 0 0 0-1.6-1.3L4.6 6.1A2 2 0 0 0 3 8v10.5A2.5 2.5 0 0 0 5.5 21h13a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 18.5 7H5" />
      <circle cx="16.5" cy="14" r="1" />
    </Icon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c0-3 3.4-5 7.5-5s7.5 2 7.5 5" />
    </Icon>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.1 4.2 2 2 0 0 1 3.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </Icon>
  );
}
