import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { Star } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FocusIn({
  children,
  delay = 0,
  className,
  ...rest
}: { children: ReactNode; delay?: number } & HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(14px)", scale: 1.05, y: 18 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, filter: "blur(0px)", scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduce ? 0.25 : 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function Brackets({ className, size = 22 }: { className?: string; size?: number }) {
  const s = { width: size, height: size };
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      <span className="absolute left-0 top-0 border-l border-t border-current opacity-60" style={s} />
      <span className="absolute right-0 top-0 border-r border-t border-current opacity-60" style={s} />
      <span className="absolute bottom-0 left-0 border-b border-l border-current opacity-60" style={s} />
      <span className="absolute bottom-0 right-0 border-b border-r border-current opacity-60" style={s} />
    </div>
  );
}

export function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-[2px]" aria-label={`${rating} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          strokeWidth={1.5}
          className={i < Math.round(rating) ? "fill-current" : "opacity-30"}
        />
      ))}
    </span>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-[11px] uppercase tracking-[0.22em] opacity-60", className)}>{children}</p>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center bg-foreground px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-background",
        className,
      )}
    >
      {children}
    </span>
  );
}