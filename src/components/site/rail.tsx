import { useCallback, useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Horizontal product rail that always opens on the first item.
 * Fights browser / router scroll restoration which otherwise leaves it mid-list.
 */
export function Rail({
  children,
  resetKey,
}: {
  children: ReactNode;
  /** Change this when the item set changes (e.g. product slugs joined). */
  resetKey?: string | number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollLeft = 0;
    try {
      el.scrollTo({ left: 0, top: 0, behavior: "instant" });
    } catch {
      el.scrollTo(0, 0);
    }
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    reset();

    // Restoration often runs after layout — keep forcing start for a short window.
    let locked = true;
    const timers = [0, 16, 50, 120, 250, 400].map((ms) => window.setTimeout(reset, ms));
    const raf = requestAnimationFrame(() => {
      reset();
      requestAnimationFrame(reset);
    });

    const onScroll = () => {
      if (locked && el.scrollLeft > 0) reset();
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    const unlock = window.setTimeout(() => {
      locked = false;
      el.removeEventListener("scroll", onScroll);
    }, 500);

    return () => {
      locked = false;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      clearTimeout(unlock);
      el.removeEventListener("scroll", onScroll);
    };
  }, [children, resetKey, reset]);

  return (
    <div
      ref={ref}
      data-scroll-restoration="manual"
      className="no-scrollbar -mx-4 flex snap-x snap-proximity gap-4 overflow-x-auto overflow-y-hidden px-4 pb-2 [overflow-anchor:none] md:mx-0 md:px-0"
    >
      {children}
    </div>
  );
}

export function RailItem({ children }: { children: ReactNode }) {
  return (
    <div className="w-[68vw] shrink-0 snap-start scroll-ml-4 md:w-[280px] md:scroll-ml-0 sm:w-[44vw]">
      {children}
    </div>
  );
}

export function Section({
  children,
  invert = false,
  className = "",
  id,
}: {
  children: ReactNode;
  invert?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={
        invert ? "band bg-ink text-paper dark:bg-[oklch(0.2_0_0)]" : "bg-background text-foreground"
      }
    >
      <div className={`mx-auto max-w-[1440px] px-4 py-16 md:px-10 md:py-24 ${className}`}>
        {children}
      </div>
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] opacity-60">{eyebrow}</p>
        <h2 className="mt-2 text-3xl md:text-4xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}
