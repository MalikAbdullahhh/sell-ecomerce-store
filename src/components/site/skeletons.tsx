import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   Base primitive — single animated block
───────────────────────────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-sm bg-muted", className)} />;
}

/* ─────────────────────────────────────────────────────────────
   Admin table — unchanged
───────────────────────────────────────────────────────────── */
export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-48" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Shared internal building blocks
───────────────────────────────────────────────────────────── */
function SkCard() {
  return (
    <div>
      <Skeleton className="aspect-[3/4] w-full" />
      <Skeleton className="mt-3 h-4 w-2/3" />
      <Skeleton className="mt-2 h-3 w-1/4" />
    </div>
  );
}

function SkHead({ wTitle = "w-52" }: { wTitle?: string }) {
  return (
    <div className="mb-6 space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className={cn("h-8 max-w-full", wTitle)} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   1. HOME PAGE
───────────────────────────────────────────────────────────── */
export function HomePageSkeleton() {
  return (
    <div>
      <Skeleton className="h-[60vw] max-h-[720px] min-h-[260px] w-full rounded-none" />
      <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-10 md:py-14">
        <SkHead />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[44vw] max-w-[220px] shrink-0">
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-muted/20 px-4 py-10 md:px-10 md:py-14">
        <div className="mx-auto max-w-[1440px]">
          <SkHead wTitle="w-40" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full rounded-none" />
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-10 md:py-14">
        <SkHead />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkCard key={i} />
          ))}
        </div>
      </div>
      <div className="border-t border-border px-4 py-16 text-center md:px-10">
        <Skeleton className="mx-auto h-24 w-40 md:h-36 md:w-52" />
        <Skeleton className="mx-auto mt-4 h-4 w-36" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   2. SHOP PAGE
───────────────────────────────────────────────────────────── */
export function ShopPageSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-10 md:py-12">
      <Skeleton className="h-3 w-40" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-52 max-w-full" />
      </div>
      <div className="mt-10 grid gap-10 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden space-y-6 md:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-8 w-full" />
              ))}
            </div>
          ))}
        </aside>
        <div>
          <div className="flex items-center justify-between border-b border-border pb-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   3. PRODUCT DETAIL PAGE
───────────────────────────────────────────────────────────── */
export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-10 md:py-12">
      <Skeleton className="h-3 w-56" />
      <div className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:gap-16">
        <div className="flex gap-3">
          <div className="hidden w-[72px] shrink-0 flex-col gap-2 md:flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
          <Skeleton className="aspect-square flex-1 rounded-none" />
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-5/6" />
            <Skeleton className="h-7 w-3/5" />
          </div>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-9 w-32" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-full" />
            ))}
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-14 w-28" />
            <Skeleton className="h-14 flex-1" />
          </div>
          <Skeleton className="h-12 w-full" />
          <div className="flex flex-wrap gap-2 pt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-28 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-14 space-y-4">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-56 w-full rounded-none md:h-72" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   4. COMPARE PAGE
───────────────────────────────────────────────────────────── */
export function ComparePageSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-10 md:py-12">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-9 w-52 max-w-full" />
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4 border border-border p-4">
            <Skeleton className="aspect-square w-full rounded-none" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <div className="space-y-2 pt-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   5. WISHLIST PAGE
───────────────────────────────────────────────────────────── */
export function WishlistPageSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-10 md:py-12">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-9 w-36 max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkCard key={i} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   6. ABOUT PAGE
───────────────────────────────────────────────────────────── */
export function AboutPageSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-14 md:px-10 md:py-20">
      <div className="space-y-3 text-center">
        <Skeleton className="mx-auto h-3 w-20" />
        <Skeleton className="mx-auto h-10 w-64 max-w-full md:w-96" />
        <Skeleton className="mx-auto h-4 w-80 max-w-full" />
        <Skeleton className="mx-auto h-4 w-64 max-w-full" />
      </div>
      <Skeleton className="mx-auto mt-14 h-56 w-full max-w-5xl rounded-none md:h-[420px]" />
      <div className="mx-auto mt-16 max-w-3xl space-y-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   7. FAQ PAGE
───────────────────────────────────────────────────────────── */
export function FaqPageSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-14 md:px-10 md:py-20">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-9 w-44 max-w-full" />
      <div className="mx-auto mt-10 max-w-3xl space-y-px">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border border-border">
            <div className="flex items-center justify-between px-5 py-4">
              <Skeleton className={cn("h-4", i % 3 === 0 ? "w-3/5" : i % 3 === 1 ? "w-4/5" : "w-2/3")} />
              <Skeleton className="ml-4 h-4 w-4 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   8. CONTACT PAGE
───────────────────────────────────────────────────────────── */
export function ContactPageSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-14 md:px-10 md:py-20">
      <div className="mx-auto max-w-xl space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-52 max-w-full" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        <Skeleton className="h-4 w-56 max-w-full" />
      </div>
      <div className="mx-auto mt-12 max-w-xl space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-36 w-full" />
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   9. JOURNAL INDEX
───────────────────────────────────────────────────────────── */
export function JournalIndexSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-10 md:py-20">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-9 w-44 max-w-full" />
      <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-video w-full rounded-none" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   10. JOURNAL ARTICLE
───────────────────────────────────────────────────────────── */
export function JournalArticleSkeleton() {
  return (
    <div>
      <Skeleton className="h-[50vw] max-h-[520px] min-h-[220px] w-full rounded-none" />
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 h-9 w-full" />
        <Skeleton className="mt-2 h-9 w-4/5" />
        <div className="mt-10 space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn("h-4", i % 5 === 4 ? "w-2/3" : i % 7 === 6 ? "w-3/4" : "w-full")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   11. ACCOUNT DASHBOARD
───────────────────────────────────────────────────────────── */
export function AccountSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-10 md:py-14">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 border border-border p-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="mt-10 space-y-3">
        <Skeleton className="h-3 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border border-border p-4">
            <Skeleton className="h-14 w-14 shrink-0 rounded-none" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-4 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   12. ACCOUNT ORDERS
───────────────────────────────────────────────────────────── */
export function AccountOrdersSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-10 md:py-14">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-9 w-36 max-w-full" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-4 border border-border p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex gap-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-14 w-14 shrink-0 rounded-none" />
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   13. LEGAL PAGE
───────────────────────────────────────────────────────────── */
export function LegalPageSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-10 md:py-20">
      <div className="grid gap-10 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden space-y-2 md:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </aside>
        <div className="space-y-8">
          <Skeleton className="h-9 w-64 max-w-full" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Legacy — kept so existing imports don't break
───────────────────────────────────────────────────────────── */
/** @deprecated Use the page-specific skeleton instead. */
export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-10 md:px-10">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-12 w-72 max-w-full" />
      <div className={cn("grid gap-4", rows > 1 ? "md:grid-cols-3" : "")}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
