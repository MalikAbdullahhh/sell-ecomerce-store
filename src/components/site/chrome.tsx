import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Heart,
  Home,
  Instagram,
  Moon,
  Search,
  ShoppingBag,
  Store,
  Sun,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { categories } from "@/data/catalog";
import { usePageContent } from "@/lib/page-content";
import { DEFAULT_TAGLINE } from "@/lib/brand";
import { useBrand, useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { CartDrawer } from "./cart-drawer";
import { SearchOverlay } from "./search-overlay";
import { AnnouncementMarquee } from "./announcement-marquee";
import { SmoothScroll } from "./smooth-scroll";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/compare", label: "Compare" },
  { to: "/journal", label: "Journal" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

function TopBar({ onSearch }: { onSearch: () => void }) {
  const { count, setCartOpen } = useStore();
  const { name: brandName } = useBrand();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const megaWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mega) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = megaWrapRef.current;
      if (!el) return;
      const target = e.target as Node;
      if (!el.contains(target)) setMega(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMega(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [mega]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-colors duration-300",
          scrolled
            ? "border-border bg-background/95 backdrop-blur"
            : "border-transparent bg-background",
        )}
      >
        <div ref={megaWrapRef}>
          <div className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 md:px-10">
            <div className="flex min-w-0 items-center gap-8">
              <Link
                to="/"
                className={cn(
                  "font-display text-lg font-semibold tracking-[-0.04em]",
                  !brandName && "invisible",
                )}
              >
                {brandName || "\u00A0"}
              </Link>
              <nav className="hidden items-center gap-6 md:flex">
                <button
                  type="button"
                  onClick={() => setMega((v) => !v)}
                  aria-expanded={mega}
                  className="font-mono text-[11px] uppercase tracking-[0.18em] hover:opacity-60"
                >
                  Categories
                </button>
                {NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    activeProps={{ className: "opacity-100" }}
                    className="font-mono text-[11px] uppercase tracking-[0.18em] opacity-70 hover:opacity-100"
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                className="grid h-11 w-11 place-items-center"
              >
                {theme === "dark" ? (
                  <Sun width={18} height={18} strokeWidth={1.5} />
                ) : (
                  <Moon width={18} height={18} strokeWidth={1.5} />
                )}
              </button>
              <button
                onClick={onSearch}
                aria-label="Search"
                className="hidden h-11 w-11 place-items-center md:grid"
              >
                <Search width={18} height={18} strokeWidth={1.5} />
              </button>
              <Link
                to="/wishlist"
                aria-label="Wishlist"
                className="hidden h-11 w-11 place-items-center md:grid"
              >
                <Heart width={18} height={18} strokeWidth={1.5} />
              </Link>
              <Link
                to="/account"
                aria-label="Account"
                className="grid h-11 w-11 place-items-center"
              >
                <User width={18} height={18} strokeWidth={1.5} />
              </Link>
              <button
                onClick={() => setCartOpen(true)}
                aria-label="Open cart"
                className="relative grid h-11 w-11 place-items-center"
              >
                <ShoppingBag width={18} height={18} strokeWidth={1.5} />
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center bg-foreground px-1 font-mono text-[9px] text-background"
                  >
                    {count}
                  </motion.span>
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mega && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="hidden overflow-hidden border-t border-border bg-background md:block"
              >
                <div className="mx-auto grid max-w-[1440px] grid-cols-6 gap-4 px-10 py-6">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      to="/shop"
                      search={{ category: c.slug }}
                      onClick={() => setMega(false)}
                      className="crosshair group"
                    >
                      <div className="aspect-[4/3] overflow-hidden border border-border">
                        <img
                          src={c.image}
                          alt={c.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <p className="mt-2 text-sm font-medium">{c.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{c.blurb}</p>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>
    </>
  );
}

const BOTTOM_TABS = ["home", "shop", "search", "wishlist", "cart"] as const;
type BottomTabId = (typeof BOTTOM_TABS)[number];

const jellySpring = {
  type: "spring" as const,
  stiffness: 140,
  damping: 18,
  mass: 1.05,
  restDelta: 0.001,
  restSpeed: 0.001,
};

function BottomTabs({
  onSearch,
  searchOpen,
}: {
  onSearch: () => void;
  searchOpen: boolean;
}) {
  const { count, setCartOpen, cartOpen } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduce = useReducedMotion();

  const active: BottomTabId | null = searchOpen
    ? "search"
    : cartOpen
      ? "cart"
      : pathname === "/"
        ? "home"
        : pathname.startsWith("/shop") || pathname.startsWith("/product")
          ? "shop"
          : pathname.startsWith("/wishlist")
            ? "wishlist"
            : null;

  const activeIndex = active ? BOTTOM_TABS.indexOf(active) : -1;

  const item =
    "relative z-10 grid h-full min-w-0 place-items-center gap-0.5 px-1 transition-[color,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";
  const label = "font-mono text-[9px] uppercase tracking-[0.14em]";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] grid h-16 grid-cols-5 overflow-hidden border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {activeIndex >= 0 &&
        (reduce ? (
          <span
            className="pointer-events-none absolute inset-y-0 w-1/5 bg-foreground"
            style={{ left: `${activeIndex * 20}%` }}
            aria-hidden
          />
        ) : (
          <motion.span
            className="pointer-events-none absolute inset-y-0 w-1/5 origin-center bg-foreground"
            initial={false}
            animate={{
              left: `${activeIndex * 20}%`,
              scaleX: [1, 1.12, 0.96, 1.02, 1],
              scaleY: [1, 0.94, 1.04, 0.99, 1],
            }}
            transition={{
              left: jellySpring,
              scaleX: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
              scaleY: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
            }}
            aria-hidden
          />
        ))}

      <Link
        to="/"
        aria-current={active === "home" ? "page" : undefined}
        className={cn(item, active === "home" ? "text-background" : "text-foreground opacity-55")}
      >
        <Home width={19} height={19} strokeWidth={1.5} />
        <span className={label}>Home</span>
      </Link>

      <Link
        to="/shop"
        aria-current={active === "shop" ? "page" : undefined}
        className={cn(item, active === "shop" ? "text-background" : "text-foreground opacity-55")}
      >
        <Store width={19} height={19} strokeWidth={1.5} />
        <span className={label}>Shop</span>
      </Link>

      <button
        type="button"
        onClick={onSearch}
        aria-label="Search"
        aria-pressed={active === "search"}
        className={cn(item, active === "search" ? "text-background" : "text-foreground opacity-55")}
      >
        <Search width={19} height={19} strokeWidth={1.5} />
        <span className={label}>Search</span>
      </button>

      <Link
        to="/wishlist"
        aria-current={active === "wishlist" ? "page" : undefined}
        className={cn(
          item,
          active === "wishlist" ? "text-background" : "text-foreground opacity-55",
        )}
      >
        <Heart width={19} height={19} strokeWidth={1.5} />
        <span className={label}>Saved</span>
      </Link>

      <button
        type="button"
        onClick={() => setCartOpen(true)}
        aria-label="Open cart"
        aria-pressed={active === "cart"}
        className={cn(
          item,
          "relative",
          active === "cart" ? "text-background" : "text-foreground opacity-55",
        )}
      >
        <ShoppingBag width={19} height={19} strokeWidth={1.5} />
        {count > 0 && (
          <span
            className={cn(
              "absolute right-2 top-1 z-20 grid h-4 min-w-4 place-items-center px-1 font-mono text-[9px] transition-colors duration-500",
              active === "cart"
                ? "bg-background text-foreground"
                : "bg-foreground text-background",
            )}
          >
            {count}
          </span>
        )}
        <span className={label}>Cart</span>
      </button>
    </nav>
  );
}

function Footer() {
  const { settings, settingsReady } = useStore();
  const { name: brandName } = useBrand();
  const { section } = usePageContent("footer");
  const brand = section<{
    name: string;
    blurb: string;
    copyright: string;
    paymentsText: string;
  }>("brand");
  const linkList = section<{ items: { column: string; label: string; href: string }[] }>("links");

  const cols: { title: string; links: { label: string; href: string }[] }[] = [];
  for (const item of linkList.items || []) {
    const title = item.column || "Links";
    const col = cols.find((c) => c.title === title);
    if (col) col.links.push(item);
    else cols.push({ title, links: [item] });
  }

  const blurb =
    (settings?.tagline || "").trim() || brand.blurb || (settingsReady ? DEFAULT_TAGLINE : "");
  const year = new Date().getFullYear();
  const copyright = brandName
    ? (brand.copyright || "").replace(/\bAperture(?: Instruments)?\b/gi, brandName) ||
      `© ${year} ${brandName}`
    : brand.copyright || `\u00A0`;
  const instagram = settings?.social?.instagram?.trim();

  return (
    <footer className="band border-t border-white/10 bg-ink text-paper dark:bg-[oklch(0.2_0_0)]">
      <div className="mx-auto max-w-[1440px] px-4 py-14 md:px-10">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <p
              className={cn(
                "font-display text-2xl font-semibold tracking-[-0.04em]",
                !brandName && "invisible",
              )}
            >
              {brandName || "\u00A0"}
            </p>
            <p className={cn("mt-3 max-w-xs text-sm text-paper/70", !blurb && "invisible")}>
              {blurb || "\u00A0"}
            </p>
            {instagram ? (
              <div className="mt-5 flex gap-3">
                <a
                  href={instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="grid h-11 w-11 place-items-center border border-white/25 transition-opacity hover:opacity-70"
                >
                  <Instagram width={16} height={16} />
                </a>
              </div>
            ) : null}
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/55">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2">
                {col.links.map((link, i) => (
                  <li key={`${link.href}-${i}`}>
                    <a
                      href={link.href}
                      className="text-sm text-paper/80 transition-opacity hover:text-paper"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/55 md:flex-row md:items-center md:justify-between">
          <span>{copyright}</span>
          <span>{brand.paymentsText}</span>
        </div>
      </div>
    </footer>
  );
}

function PageTransition({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // No mode="wait" / exit — waiting for the previous page to fade out
  // briefly flashes home (or shop) before the product page appears.
  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0.01 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin") || pathname === "/myadminlogin";

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <SmoothScroll>
      <div className="flex min-h-screen flex-col">
        <AnnouncementMarquee />
        <TopBar onSearch={() => setSearchOpen(true)} />
        <main className="flex-1 pb-16 md:pb-0">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        <BottomTabs onSearch={() => setSearchOpen(true)} searchOpen={searchOpen} />
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        <CartDrawer />
      </div>
    </SmoothScroll>
  );
}

export { X };
