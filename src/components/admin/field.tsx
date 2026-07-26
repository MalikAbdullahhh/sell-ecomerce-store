import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const adminField =
  "h-11 w-full border border-border bg-transparent px-3 font-mono text-sm outline-none focus:border-foreground disabled:opacity-50";

export const adminTextarea =
  "w-full border border-border bg-transparent p-3 font-mono text-sm outline-none focus:border-foreground disabled:opacity-50";

export const adminLabel = "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground";

export const adminBtn =
  "inline-flex h-11 items-center justify-center bg-foreground px-5 font-mono text-[11px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-90 disabled:opacity-40";

export const adminBtnOutline =
  "inline-flex h-11 items-center justify-center border border-border bg-transparent px-5 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-mist disabled:opacity-40";

export const adminBtnGhost =
  "inline-flex h-9 items-center justify-center border border-border px-3 font-mono text-[10px] uppercase tracking-[0.18em] hover:bg-mist disabled:opacity-40";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className={adminLabel}>{label}</span>
      {children}
    </label>
  );
}

export function pkr(n: number) {
  return `Rs ${Number(n || 0).toLocaleString("en-PK")}`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
