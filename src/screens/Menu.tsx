import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AddButton } from "../components/AddButton";
import { ItemSheet } from "../components/ItemSheet";
import { LanguagePicker } from "../components/LanguagePicker";
import { PaymentDetailsSheet, PaymentProgressCard } from "../components/PaymentProgress";
import { PayFlow } from "../components/PayFlow";
import { ResetTableButton } from "../components/ResetTableButton";
import { OrderTogetherSheet } from "../components/OrderTogetherSheet";
import { Photo } from "../components/Photo";
import { SideMenu } from "../components/SideMenu";
import { Tag } from "../components/Tag";
import { TourButton } from "../components/TourButton";
import { Wordmark } from "../components/Wordmark";
import {
  ClockIcon,
  CloseIcon,
  MapPinIcon,
  MenuIcon,
  StarIcon,
  ShareIcon,
  UsersIcon,
} from "../components/icons";
import { useLocation } from "wouter";
import { useCart, type LineChoice } from "../lib/cart";
import { copyText } from "../lib/clipboard";
import { useTableBill } from "../lib/tableBill";
import { tourDish, tourSeen, useTour } from "../lib/tour";
import { findItem, formatAmount, formatPrice, hasRequiredOptions, inviteUrl, menu, restaurant, type MenuItem } from "../lib/menu";

const TOAST_MS = 2500;

// Where the guest was in the menu when they opened their order, so coming
// back lands them in the same place.
let savedMenuScroll = 0;
const COMPACT_BAR_HEIGHT = 180; // px, fallback until the CompactBar is measured

export function Menu() {
  const cart = useCart();
  const [, navigate] = useLocation();

  // Restore where the guest was when they opened their order, once. Any other
  // way back to the menu (e.g. after paying) starts at the top.
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
  const closeSideMenu = useCallback(() => setSideMenuOpen(false), []);
  const [tableSheetOpen, setTableSheetOpen] = useState(false);
  const closeTableSheet = useCallback(() => setTableSheetOpen(false), []);

  // After a split payment with a balance left, the order is locked: the menu
  // is browse-only and the bottom shows payment progress plus Pay.
  const bill = useTableBill();
  const locked = bill.partlyPaid && bill.remaining > 0;
  const [payOpen, setPayOpen] = useState(false);
  const closePay = useCallback(() => setPayOpen(false), []);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const closeDetails = useCallback(() => setDetailsOpen(false), []);
  const [progressDismissed, setProgressDismissed] = useState(false);
  const [shareNote, setShareNote] = useState("");

  // Guided tour: starts on its own the first time the menu opens, and opens
  // the dish card / order-together sheet for its steps.
  const tour = useTour();
  const tourStep = tour.step?.id;
  useEffect(() => {
    if (!tourSeen()) tour.start();
    // Only when the menu first opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (tourStep === "browse") {
      // Back from the dish card.
      setSheetOpen(false);
    } else if (tourStep === "dish") {
      setSheetItem(findItem(tourDish.itemId) ?? null);
      setSheetOpen(true);
    } else if (tourStep === "together") {
      setSheetOpen(false);
      setTableSheetOpen(false); // back from the QR step
      window.scrollTo(0, 0);
      const dish = findItem(tourDish.itemId);
      if (dish) setToast({ key: Date.now(), name: dish.name, qty: 1 });
    } else if (tourStep === "qr") {
      setTableSheetOpen(true);
    }
  }, [tourStep]);

  // The reset button floats just above whatever is pinned to the bottom (the
  // order button + toast, or the payment progress panel), so track its height.
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const [bottomBarHeight, setBottomBarHeight] = useState(104);
  useEffect(() => {
    const bar = bottomBarRef.current;
    if (!bar) return;
    const observer = new ResizeObserver(() => setBottomBarHeight(bar.offsetHeight));
    observer.observe(bar);
    return () => observer.disconnect();
  }, [locked]);

  useEffect(() => {
    if (!shareNote) return;
    const timer = setTimeout(() => setShareNote(""), 2000);
    return () => clearTimeout(timer);
  }, [shareNote]);

  // Remind the others at the table to pay their part.
  const shareReminder = async () => {
    const text = `Help settle Table #${restaurant.table} at ${restaurant.name}: PKR ${formatAmount(bill.remaining)} left to pay.`;
    const url = `https://${inviteUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${restaurant.name} · Table #${restaurant.table}`, text, url });
        return;
      } catch (err) {
        if ((err as DOMException).name === "AbortError") return;
      }
    }
    if (await copyText(`${text} ${url}`)) setShareNote("Link copied");
  };

  // The compact bar is always rendered (just translated off-screen), so its
  // real height is measurable even while hidden.
  const barRef = useRef<HTMLDivElement>(null);
  const barHeight = () => barRef.current?.offsetHeight ?? COMPACT_BAR_HEIGHT;

  // The compact top bar slides in once the full-size category tabs have
  // scrolled up under where that bar sits, i.e. the menu reached the top.
  const tabsRef = useRef<HTMLElement>(null);
  const [scrolledToMenu, setScrolledToMenu] = useState(false);
  useEffect(() => {
    const tabs = tabsRef.current;
    if (!tabs) return;
    const height = barHeight();
    const observer = new IntersectionObserver(
      ([entry]) => setScrolledToMenu(!entry.isIntersecting && entry.boundingClientRect.top < height),
      { rootMargin: `-${height}px 0px 0px 0px` },
    );
    observer.observe(tabs);
    return () => observer.disconnect();
  }, []);
  const showCompactBar = scrolledToMenu || query !== "";

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
      const top = barHeight() + 2;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let current = menu[0].id;
      for (const category of menu) {
        const section = document.getElementById(`category-${category.id}`);
        if (section && (atBottom || section.getBoundingClientRect().top <= top)) current = category.id;
      }
      setActiveCategory(current);
    };
    const onScroll = () => {
      // Release the lock once scrolling has been quiet for a moment.
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

  const addItem = (item: MenuItem) => {
    cart.add(item.id);
    setToast({ key: Date.now(), name: item.name, qty: 1 });
  };

  const openItem = (item: MenuItem) => {
    setSheetItem(item);
    setSheetOpen(true);
  };

  // The purple button adds straight away only for a dish with nothing to
  // choose that isn't in the order yet; otherwise it opens the card.
  const pressAdd = (item: MenuItem) => {
    if (cart.countOf(item.id) > 0 || hasRequiredOptions(item)) openItem(item);
    else addItem(item);
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
    unlockAfter(1000); // in case the page is already there and no scroll fires
    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY - barHeight(),
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

  const tabs = <CategoryTabs activeId={activeCategory} onSelect={selectCategory} />;

  return (
    <main className={`mx-auto min-h-screen max-w-phone ${locked ? (progressDismissed ? "pb-[150px]" : "pb-[330px]") : "pb-[200px]"}`}>
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
        prefill={tourStep === "dish" ? tourDish.choice : undefined}
        onClose={closeSheet}
        onSubmit={addFromSheet}
      />
      <OrderTogetherSheet open={tableSheetOpen} onClose={closeTableSheet} />
      <CompactBar
        barRef={barRef}
        visible={showCompactBar}
        query={query}
        onQueryChange={setQuery}
        onOpenMenu={() => setSideMenuOpen(true)}
        onOpenTable={() => setTableSheetOpen(true)}
      >
        {tabs}
      </CompactBar>

      {locked ? (
        <>
          <div className="relative">
            <Photo src={restaurant.heroImage} alt={`Inside ${restaurant.name}`} className="h-[280px] w-full" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+22px)]">
              <IconButton label="Open menu" onClick={() => setSideMenuOpen(true)}>
                <MenuIcon className="h-5 w-5" />
              </IconButton>
              <div className="flex items-center gap-5">
                <LanguagePicker active={!showCompactBar} />
                <IconButton label="Remind others to pay" onClick={shareReminder}>
                  <ShareIcon className="h-5 w-5" />
                </IconButton>
              </div>
            </div>
            {shareNote && (
              <span
                role="status"
                className="absolute right-5 top-[calc(env(safe-area-inset-top)+76px)] animate-toast-in rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white"
              >
                {shareNote}
              </span>
            )}
          </div>
          <section className="relative -mt-5 rounded-t-[20px] bg-white pt-[50px]">
            <div className="absolute left-1/2 top-0 h-[85px] w-[85px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border border-icon-muted bg-white p-2">
              <Photo src={restaurant.logo} alt={`${restaurant.name} logo`} className="h-full w-full !bg-transparent" />
            </div>
            <h1 className="text-center text-4xl font-bold leading-[0.94]">{restaurant.name}</h1>
            <nav ref={tabsRef} className="mt-2.5 border-b border-hairline pb-1.5">
              {tabs}
            </nav>
          </section>
        </>
      ) : (
        <>
        <header className="flex items-center gap-[15px] px-5 pb-[22px] pt-[calc(env(safe-area-inset-top)+22px)]">
          <IconButton label="Open menu" onClick={() => setSideMenuOpen(true)}>
            <MenuIcon className="h-5 w-5" />
          </IconButton>
          <Wordmark />
        </header>

        <div className="relative">
          <Photo src={restaurant.heroImage} alt={`Inside ${restaurant.name}`} className="h-[220px] w-full" />
          <div className="absolute bottom-[-45px] left-1/2 z-10 -translate-x-1/2 rounded-[21px] bg-white p-[13px] ring-[1.3px] ring-inset ring-hairline">
            <Photo src={restaurant.logo} alt={`${restaurant.name} logo`} className="h-16 w-16 !bg-transparent" />
          </div>
        </div>

        <section className="relative bg-white pb-2.5 pt-[25px]">
          <IconButton
            label="Order together"
            className="absolute right-[18px] top-[9px]"
            onClick={() => setTableSheetOpen(true)}
          >
            <UsersIcon className="h-6 w-6" />
          </IconButton>

          <div className="flex flex-col gap-[18px] px-5">
            <div className="flex flex-col gap-2.5">
              <p className="text-xs font-medium uppercase leading-none tracking-[0.03em] text-ink-muted">
                Table Tap
              </p>
              <h1 className="text-4xl font-bold leading-[0.94]">{restaurant.name}</h1>
              <div className="mt-2 flex flex-col items-center gap-[18px] text-[15px] font-medium leading-none tracking-[0.03em] text-ink-muted">
                <div className="flex flex-wrap items-center justify-center gap-x-[18px] gap-y-2">
                  <span className="flex items-center gap-1.5">
                    <StarIcon className="h-[18px] w-[18px] text-star" strokeWidth={1.5} />
                    {restaurant.rating} • {restaurant.guests} guests
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPinIcon className="h-[18px] w-[18px] text-icon-muted" strokeWidth={1.5} />
                    {restaurant.area}
                  </span>
                </div>
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="h-[18px] w-[18px] text-icon-muted" strokeWidth={1.5} />
                  House service: {restaurant.hours}
                </span>
              </div>
            </div>

            <div className="grid h-[92px] grid-cols-2 rounded-[18px] ring-1 ring-inset ring-hairline">
              <Stat value={`#${restaurant.table}`} label="Current Table" />
              <Stat value={restaurant.serviceTime} label="Average service time" divider />
            </div>
          </div>

          <nav ref={tabsRef} className="mt-[26px] border-y border-hairline bg-white py-[15px]">
            {tabs}
          </nav>
        </section>
        </>
      )}

      {/* min-height keeps the scroll position stable while search narrows the list. */}
      <div className="min-h-[100dvh]">
        {visibleCategories.map((category, index) => (
          <section
            key={category.id}
            id={`category-${category.id}`}
            // The last section gets enough height to scroll all the way up
            // under the bar, so tapping its tab lands like the others.
            style={
              index === visibleCategories.length - 1
                ? { minHeight: `calc(100dvh - ${COMPACT_BAR_HEIGHT}px)` }
                : undefined
            }
            className="flex flex-col gap-[25px] px-4 pt-[25px]"
          >
            <h2 className="text-[22px] font-bold leading-none">{category.name}</h2>
            {category.items.map((item) => (
              <MenuRow
                key={item.id}
                item={item}
                locked={locked}
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

      {locked ? (
        <div
          ref={bottomBarRef}
          className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-phone flex-col gap-[9px] border-t border-[#dbdbdb] bg-white px-[17px] pb-[calc(env(safe-area-inset-bottom)+20px)] pt-3">
          {!progressDismissed && (
            <PaymentProgressCard
              bill={bill}
              onViewDetails={() => setDetailsOpen(true)}
              onDismiss={() => setProgressDismissed(true)}
            />
          )}
          <div className="px-2">
            <button
              type="button"
              onClick={() => setPayOpen(true)}
              className="flex w-full items-center justify-center rounded-full bg-black py-[22px] text-xl leading-none text-white transition active:scale-[0.98]"
            >
              Pay
            </button>
          </div>
        </div>
      ) : (
        <>
        {/* Always shown: the table's shared order exists even before you add anything. */}
        <div
          ref={bottomBarRef}
          className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-phone px-[25px] pb-[calc(env(safe-area-inset-bottom)+20px)]"
        >
          {toast && (
            <AddedToast key={toast.key} name={toast.name} qty={toast.qty} onClose={() => setToast(null)} />
          )}
          <button
            type="button"
            onClick={() => {
              savedMenuScroll = window.scrollY;
              navigate("/order");
            }}
            className="relative flex w-full items-center justify-center rounded-full bg-black py-[22px] text-xl leading-none text-white transition active:scale-[0.98]"
          >
            View your order
            {cart.count > 0 && (
              <span className="absolute right-[18px] top-1/2 flex h-6 min-w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white px-1.5 text-base leading-none text-black">
                {cart.count}
              </span>
            )}
          </button>
        </div>
        </>
      )}
      {!tour.step && (
        <>
          <TourButton bottom={`${bottomBarHeight + 68}px`} />
          <ResetTableButton bottom={`${bottomBarHeight + 12}px`} />
        </>
      )}
      <PayFlow open={payOpen} onClose={closePay} bill={bill} />
      <PaymentDetailsSheet open={detailsOpen} onClose={closeDetails} bill={bill} />
    </main>
  );
}

function CompactBar({
  barRef,
  visible,
  query,
  onQueryChange,
  onOpenMenu,
  onOpenTable,
  children,
}: {
  barRef: React.Ref<HTMLDivElement>;
  visible: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onOpenMenu: () => void;
  onOpenTable: () => void;
  children: ReactNode;
}) {
  return (
    <div
      ref={barRef}
      aria-hidden={!visible}
      className={`fixed inset-x-0 top-0 z-40 mx-auto max-w-phone bg-white pt-[calc(env(safe-area-inset-top)+22px)] transition duration-300 ease-out ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
      }`}
    >
      <div className="flex items-center justify-between px-5">
        <div className="flex items-center gap-[15px]">
          <IconButton label="Open menu" onClick={onOpenMenu}>
            <MenuIcon className="h-5 w-5" />
          </IconButton>
          <span className="text-2xl font-bold leading-none">{restaurant.name}</span>
        </div>
        <div className="flex items-center gap-5">
          <LanguagePicker active={visible} />
          <IconButton label="Order together" onClick={onOpenTable}>
            <UsersIcon className="h-5 w-5" strokeWidth={1.67} />
          </IconButton>
        </div>
      </div>
      <div className="mt-2.5 px-5">
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search Menu..."
          tabIndex={visible ? 0 : -1}
          className="w-full rounded-3xl bg-transparent px-6 py-[12.5px] text-base font-medium leading-none tracking-[0.03em] outline-none ring-1 ring-inset ring-hairline placeholder:text-ink-muted focus:ring-ink/40"
        />
      </div>
      <div className="mt-2.5 border-b border-hairline pb-[15px]">{children}</div>
    </div>
  );
}

export function CategoryTabs({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  const stripRef = useRef<HTMLDivElement>(null);

  // Slide the strip only when the active tab is cut off, so tapping a visible
  // tab never starts a second smooth scroll alongside the page scroll.
  useEffect(() => {
    const strip = stripRef.current;
    const tab = strip?.querySelector<HTMLElement>(`[data-category="${activeId}"]`);
    if (!strip || !tab) return;
    const left = tab.offsetLeft - strip.scrollLeft;
    const fullyVisible = left >= 0 && left + tab.offsetWidth <= strip.clientWidth;
    if (!fullyVisible) {
      strip.scrollTo({ left: tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2, behavior: "smooth" });
    }
  }, [activeId]);

  return (
    <div ref={stripRef} className="no-scrollbar relative flex gap-[31px] overflow-x-auto px-5">
      {menu.map((category) => {
        const active = category.id === activeId;
        return (
          <button
            key={category.id}
            type="button"
            data-category={category.id}
            onClick={() => onSelect(category.id)}
            className={`shrink-0 whitespace-nowrap border-b py-2.5 text-sm font-bold leading-none transition-colors duration-200 ${
              active ? "border-ink text-ink" : "border-transparent text-ink-muted"
            }`}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}

export function IconButton({
  label,
  className = "",
  onClick,
  children,
}: {
  label: string;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-inset ring-hairline ${className}`}
    >
      {children}
    </button>
  );
}

function Stat({ value, label, divider }: { value: string; label: string; divider?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-[11px] text-center ${
        divider ? "border-l border-hairline" : ""
      }`}
    >
      <span className="text-lg font-bold leading-none">{value}</span>
      <span className="text-sm font-medium leading-none text-ink-muted">{label}</span>
    </div>
  );
}

export function MenuRow({
  item,
  locked,
  count,
  onPress,
  onOpen,
}: {
  item: MenuItem;
  locked: boolean;
  count: number;
  onPress: () => void;
  onOpen: () => void;
}) {
  // Browse-only once the order is locked by a split payment.
  if (locked && !item.soldOut) {
    return (
      <article aria-label={`${item.name}, ${formatPrice(item.price)}`} className="flex items-start gap-2.5">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2.5">
          <h3 className="text-base font-bold leading-none">{item.name}</h3>
          <p className="text-sm font-bold leading-[1.3] text-ink-muted">{item.description}</p>
          <p className="text-sm font-bold leading-[1.1]">{formatPrice(item.price)}</p>
          {item.tag && <Tag tag={item.tag} />}
        </div>
        <Photo src={item.image} alt={item.name} className="h-[122px] w-[122px] shrink-0 rounded-2xl" />
      </article>
    );
  }

  if (item.soldOut) {
    return (
      <article aria-disabled="true" aria-label={`${item.name}, sold out`} className="flex items-start gap-2.5">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2.5 opacity-50">
          <h3 className="text-base font-bold leading-none">{item.name}</h3>
          <p className="text-sm font-bold leading-[1.3] text-ink-muted">{item.description}</p>
          <p className="text-sm font-bold leading-[1.1]">{formatPrice(item.price)}</p>
        </div>
        <div className="relative shrink-0">
          <Photo src={item.image} alt={item.name} className="h-[122px] w-[122px] rounded-2xl opacity-60 grayscale" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.04em] shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
            Sold out
          </span>
        </div>
      </article>
    );
  }

  return (
    // The whole row opens the dish sheet; the purple button may add directly.
    <article
      role="button"
      tabIndex={0}
      aria-label={`${item.name}, ${formatPrice(item.price)}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen();
        }
      }}
      className="flex cursor-pointer items-start gap-2.5 rounded-2xl outline-none transition active:opacity-80 focus-visible:ring-2 focus-visible:ring-ink/30"
    >
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2.5">
        <h3 className="text-base font-bold leading-none">{item.name}</h3>
        <p className="text-sm font-bold leading-[1.3] text-ink-muted">{item.description}</p>
        <p className="text-sm font-bold leading-[1.1]">{formatPrice(item.price)}</p>
        {item.tag && <Tag tag={item.tag} />}
      </div>
      <div className="relative shrink-0">
        <Photo src={item.image} alt={item.name} className="h-[122px] w-[122px] rounded-2xl" />
        <AddButton name={item.name} count={count} onPress={onPress} className="right-2 top-2" />
      </div>
    </article>
  );
}

export function AddedToast({ name, qty, onClose }: { name: string; qty: number; onClose: () => void }) {
  return (
    <div role="status" className="mb-[11px] animate-toast-in drop-shadow-[0_0_15px_rgba(0,0,0,0.2)]">
      <div className="flex items-start justify-between gap-2 rounded-full bg-black px-3 py-5 text-sm font-medium leading-none tracking-[0.015em] text-white">
        <span>
          {qty} {name} {qty === 1 ? "has" : "have"} been added
        </span>
        <button type="button" onClick={onClose} aria-label="Dismiss" className="-m-2 p-2">
          <CloseIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
      {/* Little pointer down towards the order button. */}
      <div className="ml-7 h-0 w-0 border-x-[4px] border-t-[6px] border-x-transparent border-t-black/90" />
    </div>
  );
}
