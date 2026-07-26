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
import { useStore } from "@/lib/store";
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
                APERTURE
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
                className="grid h-11 w-11 place-items-center"
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

function BottomTabs() {
  const { count, setCartOpen } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const item = "grid h-full min-w-11 place-items-center gap-1";
  const label = "font-mono text-[9px] uppercase tracking-[0.14em]";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] grid h-16 grid-cols-4 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <Link to="/" className={cn(item, pathname === "/" ? "opacity-100" : "opacity-55")}>
        <Home width={19} height={19} strokeWidth={1.5} />
        <span className={label}>Home</span>
      </Link>
      <Link
        to="/shop"
        className={cn(item, pathname.startsWith("/shop") ? "opacity-100" : "opacity-55")}
      >
        <Store width={19} height={19} strokeWidth={1.5} />
        <span className={label}>Shop</span>
      </Link>
      <Link
        to="/wishlist"
        className={cn(item, pathname.startsWith("/wishlist") ? "opacity-100" : "opacity-55")}
      >
        <Heart width={19} height={19} strokeWidth={1.5} />
        <span className={label}>Saved</span>
      </Link>
      <button onClick={() => setCartOpen(true)} className={cn(item, "relative opacity-55")}>
        <ShoppingBag width={19} height={19} strokeWidth={1.5} />
        {count > 0 && (
          <span className="absolute right-3 top-1 grid h-4 min-w-4 place-items-center bg-foreground px-1 font-mono text-[9px] text-background">
            {count}
          </span>
        )}
        <span className={label}>Cart</span>
      </button>
    </nav>
  );
}

function Footer() {
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

  return (
    <footer className="border-t border-border bg-foreground text-background">
      <div className="mx-auto max-w-[1440px] px-4 py-14 md:px-10">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <p className="font-display text-2xl font-semibold tracking-[-0.04em]">{brand.name}</p>
            <p className="mt-3 max-w-xs text-sm opacity-70">{brand.blurb}</p>
            <div className="mt-5 flex gap-3">
              <span className="grid h-11 w-11 place-items-center border border-background/30">
                <Instagram width={16} height={16} />
              </span>
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2">
                {col.links.map((link, i) => (
                  <li key={`${link.href}-${i}`}>
                    <a href={link.href} className="text-sm opacity-80 hover:opacity-100">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-background/20 pt-6 font-mono text-[10px] uppercase tracking-[0.18em] opacity-60 md:flex-row md:items-center md:justify-between">
          <span>{brand.copyright}</span>
          <span>{brand.paymentsText}</span>
        </div>
      </div>
    </footer>
  );
}

function PageTransition({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
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
        <BottomTabs />
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        <CartDrawer />
      </div>
    </SmoothScroll>
  );
}

export { X };
