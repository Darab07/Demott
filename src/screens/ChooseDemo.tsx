import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { Wordmark } from "../components/Wordmark";
import { CarIcon, ChevronRightIcon, QrIcon } from "../components/icons";

export function ChooseDemo() {
  const [, navigate] = useLocation();

  return (
    <main className="mx-auto min-h-screen max-w-phone px-5 pt-[calc(env(safe-area-inset-top)+22px)]">
      <header className="py-[2px]">
        <Wordmark />
      </header>

      <section className="mt-[31px] flex flex-col gap-[11px]">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold leading-[1.02]">
            How would you like
            <br />
            to order?
          </h1>
          <p className="text-[15px] font-medium tracking-[0.03em] text-ink-muted">Pick a demo to explore</p>
        </div>

        <DemoCard
          icon={<QrIcon className="h-6 w-6" />}
          title="Scan & order at your table"
          description="Dine-in QR ordering — browse, order & split the bill"
          onClick={() => navigate("/table")}
        />
        <DemoCard
          icon={<CarIcon className="h-6 w-6" />}
          title="Curbside / Pickup"
          description="Order ahead — we bring it out to your car"
          onClick={() => navigate("/pickup")}
        />
      </section>
    </main>
  );
}

type DemoCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
};

function DemoCard({ icon, title, description, onClick }: DemoCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-[18px] bg-white px-4 py-[15px] text-left ring-1 ring-inset ring-hairline transition active:scale-[0.99] active:bg-cream"
    >
      <span className="flex shrink-0 items-center justify-center rounded-2xl bg-plum p-3 text-white">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[17px] font-bold">{title}</span>
        <span className="text-[13px] font-medium text-ink-muted">{description}</span>
      </span>
      <ChevronRightIcon className="h-5 w-5 shrink-0" />
    </button>
  );
}
