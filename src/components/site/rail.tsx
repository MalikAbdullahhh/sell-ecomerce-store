import type { ReactNode } from "react";

export function Rail({ children }: { children: ReactNode }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
      {children}
    </div>
  );
}

export function RailItem({ children }: { children: ReactNode }) {
  return <div className="w-[68vw] shrink-0 snap-start sm:w-[44vw] md:w-[280px]">{children}</div>;
}

export function Section({
  children,
  invert = false,
  className = "",
}: {
  children: ReactNode;
  invert?: boolean;
  className?: string;
}) {
  return (
    <section className={invert ? "bg-foreground text-background" : "bg-background text-foreground"}>
      <div className={`mx-auto max-w-[1440px] px-4 py-16 md:px-10 md:py-24 ${className}`}>{children}</div>
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