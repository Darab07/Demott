import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ItemSheet } from "../components/ItemSheet";
import { LanguagePicker } from "../components/LanguagePicker";
import { ActiveOrders } from "../components/OrderTrackingCard";
import { PickupModePicker } from "../components/PickupModePicker";
import { ResetTableButton } from "../components/ResetTableButton";
import { TourButton } from "../components/TourButton";
import { SideMenu } from "../components/SideMenu";
import { ClockIcon, MenuIcon } from "../components/icons";
import { useCart, type LineChoice } from "../lib/cart";
import { findItem, hasRequiredOptions, menu, restaurant, type MenuItem } from "../lib/menu";
import { resetPickupDemo } from "../lib/demo";
import { pickupTourSeen } from "../lib/pickupTour";
import { tourDish, useTour } from "../lib/tour";
import { loadPickupOrders, READY_IN, savePickupOrder, type PickupOrder } from "../lib/pickup";
import { AddedToast, CategoryTabs, IconButton, MenuRow } from "./Menu";

const TOAST_MS = 2500;
const HEADER_HEIGHT = 240; // px, fallback until the header is measured

// Where the guest was in the menu when they opened their order.
let savedMenuScroll = 0;

// Curbside / Pickup menu: the dine-in menu without the table parts (no hero,
// ordering together or payment progress). The header stays pinned with the
// pickup/curbside choice and the ready time.
export function PickupMenu() {
  const cart = useCart();
  const [, navigate] = useLocation();

  useEffect(() => {
    window.scrollTo(0, savedMenuScroll);
    savedMenuScroll = 0;
  }, []);

  const [activeCategory, setActiveCategory] = useState(menu[0].id);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<{ key: number; name: string; qty: number } | null>(null);
  const [sheetItem, setSheetItem] = useState<MenuItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  // Orders already placed are tracked from cards above "View your order",
  // newest first.
  const [active, setActive] = useState(() =>
    loadPickupOrders()
      .filter((order) => !order.dismissed)
      .reverse(),
  );
  const placed = active.length > 0;

  // The bottom bar grows with the tracking cards; keep the menu clear of it.
  const bottomRef = useRef<HTMLDivElement>(null);
  const [barHeight, setBarHeight] = useState(0);
  const bottomPad = Math.max(200, barHeight + 40);
  useEffect(() => {
    const bar = bottomRef.current;
    if (!bar) return;
    const observer = new ResizeObserver(() => setBarHeight(bar.offsetHeight));
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);
  const dismissTracking = (order: PickupOrder) => {
    savePickupOrder({ ...order, dismissed: true });
    setActive((orders) => orders.filter((o) => o.orderNo !== order.orderNo));
  };
  const closeSideMenu = useCallback(() => setSideMenuOpen(false), []);

  // Guided tour: starts on its own the first time this menu opens; on the
  // customise step it opens the sample dish with choices made.
  const tour = useTour();
  const tourStep = tour.step?.id;
  useEffect(() => {
    if (!pickupTourSeen()) tour.start();
    // Only on first open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (tourStep === "mode") {
      setSheetOpen(false); // back from the dish card
    } else if (tourStep === "dish") {
      setSheetItem(findItem(tourDish.itemId) ?? null);
      setSheetOpen(true);
    }
  }, [tourStep]);

  const headerRef = useRef<HTMLElement>(null);
  const headerHeight = () => headerRef.current?.offsetHeight ?? HEADER_HEIGHT;
  const [pad, setPad] = useState(HEADER_HEIGHT);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const observer = new ResizeObserver(() => setPad(header.offsetHeight));
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  // While a tab-tap scroll is in flight, the underline stays on the tapped
  // category instead of flickering through every section passed on the way.
  const scrollLockRef = useRef(false);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const unlockAfter = (ms: number) => {
    clearTimeout(unlockTimerRef.current);
    unlockTimerRef.current = setTimeout(() => (scrollLockRef.current = false), ms);
  };

  // Underline whichever category is currently at the top of the menu.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = headerHeight() + 2;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let current = menu[0].id;
      for (const category of menu) {
        const section = document.getElementById(`category-${category.id}`);
        if (section && (atBottom || section.getBoundingClientRect().top <= top)) current = category.id;
      }
      setActiveCategory(current);
    };
    const onScroll = () => {
      if (scrollLockRef.current) return unlockAfter(150);
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      clearTimeout(unlockTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const openItem = (item: MenuItem) => {
    setSheetItem(item);
    setSheetOpen(true);
  };

  // Same rule as dine-in: add straight away only for a dish with nothing to
  // choose that isn't in the order yet; otherwise open the card.
  const pressAdd = (item: MenuItem) => {
    if (cart.countOf(item.id) > 0 || hasRequiredOptions(item)) return openItem(item);
    cart.add(item.id);
    setToast({ key: Date.now(), name: item.name, qty: 1 });
  };

  const addFromSheet = (item: MenuItem, { selections, note, qty }: LineChoice) => {
    cart.add(item.id, { selections, note, qty });
    setSheetOpen(false);
    setToast({ key: Date.now(), name: item.name, qty });
  };

  const selectCategory = (id: string) => {
    const section = document.getElementById(`category-${id}`);
    if (!section) return;
    setActiveCategory(id);
    scrollLockRef.current = true;
    unlockAfter(1000);
    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY - headerHeight(),
      behavior: "smooth",
    });
  };

  const search = query.trim().toLowerCase();
  const visibleCategories = menu
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) => !search || `${item.name} ${item.description}`.toLowerCase().includes(search),
      ),
    }))
    .filter((category) => category.items.length > 0);

  return (
    <main
      className="mx-auto min-h-screen max-w-phone"
      style={{ paddingTop: pad, paddingBottom: bottomPad }}
    >
      <SideMenu
        open={sideMenuOpen}
        onClose={closeSideMenu}
        onStartTour={() => {
          setSideMenuOpen(false);
          tour.start();
        }}
        onChooseDemo={() => navigate("~/")}
      />
      <ItemSheet
        item={sheetItem}
        open={sheetOpen}
        onClose={closeSheet}
        onSubmit={addFromSheet}
        prefill={tourStep === "dish" ? tourDish.choice : undefined}
      />

      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-40 mx-auto flex max-w-phone flex-col gap-2.5 bg-white pt-[calc(env(safe-area-inset-top)+22px)]"
      >
        <div className="flex items-center justify-between px-5">
          <div className="flex items-center gap-[15px]">
            <IconButton label="Open menu" onClick={() => setSideMenuOpen(true)}>
              <MenuIcon className="h-5 w-5" />
            </IconButton>
            <h1 className="text-2xl font-bold leading-none">{restaurant.name}</h1>
          </div>
          <LanguagePicker />
        </div>

        <div data-tour="pickup-mode" className="flex items-center justify-between gap-3 px-5">
          <PickupModePicker forceOpen={tourStep === "mode"} />
          <p className="flex items-center gap-1.5 text-sm font-medium text-ink-muted">
            <ClockIcon className="h-4 w-4 text-ink" strokeWidth={1.6} />
            Ready in {READY_IN}
          </p>
        </div>

        <div className="px-5">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Menu..."
            className="w-full rounded-3xl bg-transparent px-6 py-[12.5px] text-base font-medium leading-none tracking-[0.03em] outline-none ring-1 ring-inset ring-hairline placeholder:text-ink-muted focus:ring-ink/40"
          />
        </div>

        <nav className="border-b border-hairline pb-[15px]">
          <CategoryTabs activeId={activeCategory} onSelect={selectCategory} />
        </nav>
      </header>

      {/* min-height keeps the scroll position stable while search narrows the list. */}
      <div className="min-h-[100dvh]">
        {visibleCategories.map((category, index) => (
          <section
            key={category.id}
            id={`category-${category.id}`}
            // The last section gets enough height to scroll all the way up
            // under the header, so tapping its tab lands like the others.
            style={index === visibleCategories.length - 1 ? { minHeight: `calc(100dvh - ${pad}px)` } : undefined}
            className="flex flex-col gap-[25px] px-4 pt-[25px]"
          >
            <h2 className="text-[22px] font-bold leading-none">{category.name}</h2>
            {category.items.map((item) => (
              <MenuRow
                key={item.id}
                item={item}
                locked={false}
                count={cart.countOf(item.id)}
                onPress={() => pressAdd(item)}
                onOpen={() => openItem(item)}
              />
            ))}
          </section>
        ))}
        {visibleCategories.length === 0 && (
          <p className="px-4 pt-[25px] text-[15px] font-medium text-ink-muted">No dishes match “{query}”.</p>
        )}
      </div>

      <div
        ref={bottomRef}
        className={`fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-phone flex-col pb-[calc(env(safe-area-inset-bottom)+20px)] ${
          placed ? "gap-[9px] border-t border-[#dbdbdb] bg-white px-[17px] pt-3" : "px-[25px]"
        }`}
      >
        {toast && <AddedToast key={toast.key} name={toast.name} qty={toast.qty} onClose={() => setToast(null)} />}
        {placed && (
          <div data-tour="active-orders">
            <ActiveOrders
              orders={active}
              onViewDetails={(order) => navigate(`/track/${order.orderNo}`)}
              onDismiss={dismissTracking}
            />
          </div>
        )}
        {/* Only once there's something in the order. */}
        {cart.count > 0 && (
          <button
            type="button"
            onClick={() => {
              savedMenuScroll = window.scrollY;
              navigate("/order");
            }}
            className={`relative flex animate-toast-in items-center justify-center rounded-full bg-black py-[22px] text-xl leading-none text-white transition active:scale-[0.98] motion-reduce:animate-none ${
              placed ? "mx-2" : "w-full"
            }`}
          >
            View your order
            <span className="absolute right-[18px] top-1/2 flex h-6 min-w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white px-1.5 text-base leading-none text-black">
              {cart.count}
            </span>
          </button>
        )}
      </div>

      {!tour.step && (
        <>
          <TourButton bottom={`${barHeight + 68}px`} />
          <ResetTableButton
            bottom={`${barHeight + 12}px`}
            title="Reset the demo?"
            body="Clears your cart, any orders being tracked and saved details, so the demo starts from the beginning."
            label="Reset demo"
            onReset={resetPickupDemo}
          />
        </>
      )}
    </main>
  );
}
