import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Facebook,
  Heart,
  Home,
  Instagram,
  Linkedin,
  Moon,
  Search,
  ShoppingBag,
  Store,
  Sun,
  User,
  X,
  Youtube,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode, lazy, Suspense } from "react";
import { usePageContent } from "@/lib/page-content";
import { DEFAULT_TAGLINE } from "@/lib/brand";
import { mediaUrl } from "@/lib/api";
import { useBrand, useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { CartDrawer } from "./cart-drawer";
import { SearchOverlay } from "./search-overlay";
import { AnnouncementMarquee } from "./announcement-marquee";
import { SiteBootLoader } from "./site-boot-loader";
import { SmoothScroll } from "./smooth-scroll";

const AmbientFallout = lazy(() =>
  import("./ambient-fallout").then((m) => ({ default: m.AmbientFallout })),
);

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/compare", label: "Compare" },
  { to: "/journal", label: "Journal" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

function TopBar({ onSearch }: { onSearch: () => void }) {
  const { count, setCartOpen, categories, wishlist } = useStore();
  const wishlistCount = wishlist.length;
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
              <Link to="/" className="font-display text-lg font-semibold tracking-[-0.04em]">
                {brandName}
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
                className="relative hidden h-11 w-11 place-items-center md:grid"
              >
                <Heart width={18} height={18} strokeWidth={1.5} />
                {wishlistCount > 0 && (
                  <motion.span
                    key={wishlistCount}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center bg-foreground px-1 font-mono text-[9px] text-background"
                  >
                    {wishlistCount}
                  </motion.span>
                )}
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
                        {c.image ? (
                          <img
                            src={mediaUrl(c.image)}
                            alt={c.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted" />
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium">{c.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{c.blurb}</p>
                    </Link>
                  ))}
                  {categories.length === 0 && (
                    <p className="col-span-6 font-mono text-[11px] text-muted-foreground">
                      No categories yet
                    </p>
                  )}
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

function BottomTabs({ onSearch, searchOpen }: { onSearch: () => void; searchOpen: boolean }) {
  const { count, setCartOpen, cartOpen, wishlist } = useStore();
  const wishlistCount = wishlist.length;
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
        aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : "Wishlist"}
        className={cn(
          item,
          "relative",
          active === "wishlist" ? "text-background" : "text-foreground opacity-55",
        )}
      >
        <Heart width={19} height={19} strokeWidth={1.5} />
        {wishlistCount > 0 && (
          <span
            className={cn(
              "absolute right-2 top-1 z-20 grid h-4 min-w-4 place-items-center px-1 font-mono text-[9px] transition-colors duration-500",
              active === "wishlist"
                ? "bg-background text-foreground"
                : "bg-foreground text-background",
            )}
          >
            {wishlistCount}
          </span>
        )}
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
              active === "cart" ? "bg-background text-foreground" : "bg-foreground text-background",
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

const SOCIAL_ORDER = [
  "instagram",
  "facebook",
  "twitter",
  "x",
  "youtube",
  "tiktok",
  "linkedin",
] as const;

function XSocialIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52V6.79a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function SocialIcon({ network }: { network: string }) {
  const key = network.toLowerCase();
  if (key === "instagram") return <Instagram width={16} height={16} />;
  if (key === "facebook") return <Facebook width={16} height={16} />;
  if (key === "youtube") return <Youtube width={16} height={16} />;
  if (key === "linkedin") return <Linkedin width={16} height={16} />;
  if (key === "twitter" || key === "x") return <XSocialIcon />;
  if (key === "tiktok") return <TikTokIcon />;
  return <span className="font-mono text-[10px] uppercase">{key.slice(0, 2)}</span>;
}

function Footer() {
  const { settings } = useStore();
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

  const blurb = (settings?.tagline || "").trim() || brand.blurb || DEFAULT_TAGLINE;
  const year = new Date().getFullYear();
  const copyright =
    (brand.copyright || "").replace(/\bAperture(?: Instruments)?\b/gi, brandName) ||
    `© ${year} ${brandName}`;

  const socialEntries = Object.entries(settings?.social || {})
    .map(([network, url]) => [network, (url || "").trim()] as const)
    .filter(([, url]) => Boolean(url))
    .sort(([a], [b]) => {
      const ai = SOCIAL_ORDER.indexOf(a.toLowerCase() as (typeof SOCIAL_ORDER)[number]);
      const bi = SOCIAL_ORDER.indexOf(b.toLowerCase() as (typeof SOCIAL_ORDER)[number]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  return (
    <footer className="band border-t border-white/10 bg-ink text-paper dark:bg-[oklch(0.2_0_0)]">
      <div className="mx-auto max-w-[1440px] px-4 py-14 md:px-10">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <p className="font-display text-2xl font-semibold tracking-[-0.04em]">{brandName}</p>
            <p className="mt-3 max-w-xs text-sm text-paper/70">{blurb}</p>
            {socialEntries.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-3">
                {socialEntries.map(([network, url]) => (
                  <a
                    key={network}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={network === "twitter" || network === "x" ? "X" : network.charAt(0).toUpperCase() + network.slice(1)}
                    className="grid h-11 w-11 place-items-center border border-white/25 transition-opacity hover:opacity-70"
                  >
                    <SocialIcon network={network} />
                  </a>
                ))}
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
  // Intentionally no keyed opacity remount — that briefly blanks/flashes the previous page.
  return <>{children}</>;
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [showFallout, setShowFallout] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin") || pathname === "/myadminlogin";

  useEffect(() => {
    if (isAdmin) return;
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const enable = () => {
      if (!cancelled) setShowFallout(true);
    };

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(enable, { timeout: 1800 });
    } else {
      timeoutId = window.setTimeout(enable, 900);
    }

    return () => {
      cancelled = true;
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [isAdmin]);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <SmoothScroll>
      <SiteBootLoader />
      <div className="relative flex min-h-screen flex-col">
        {showFallout ? (
          <Suspense fallback={null}>
            <AmbientFallout />
          </Suspense>
        ) : null}
        <div className="relative z-[2] flex min-h-screen flex-col">
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
      </div>
    </SmoothScroll>
  );
}

export { X };
