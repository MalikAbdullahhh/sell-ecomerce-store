import { Heart, MessageCircle, Facebook, Instagram } from "lucide-react";
import { mediaUrl, type TestimonialDoc } from "@/lib/api";
import { cn } from "@/lib/utils";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function PlatformIcon({ platform }: { platform?: string }) {
  const cls = "h-4 w-4 shrink-0";
  if (platform === "facebook") return <Facebook className={cn(cls, "text-[#1877F2]")} />;
  if (platform === "twitter" || platform === "x") return <XIcon className={cls} />;
  return <Instagram className={cn(cls, "text-[#E4405F]")} />;
}

function formatStamp(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function highlightMentions(text: string) {
  const parts = text.split(/(@[\w.]+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="text-sky-600 dark:text-sky-400">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function Card({ t }: { t: TestimonialDoc }) {
  const metaTop = t.layout === "meta-top";
  const handle = t.handle || (t.email ? `@${t.email.split("@")[0]}` : "");
  const meta = (
    <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <Heart width={12} height={12} /> {t.likes ?? 0}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle width={12} height={12} /> {t.comments ?? 0}
        </span>
      </div>
      <span className="font-mono text-[10px]">{formatStamp(t.dateAdded)}</span>
    </div>
  );
  const person = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={mediaUrl(t.image) || "https://api.dicebear.com/7.x/initials/svg?seed=" + t.name}
          alt=""
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{t.name}</p>
          {(handle || t.email) && (
            <p className="truncate text-xs text-muted-foreground">{handle || t.email}</p>
          )}
        </div>
      </div>
      <PlatformIcon platform={t.platform} />
    </div>
  );

  return (
    <article className="flex w-[300px] shrink-0 flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-[oklch(0.22_0_0)] sm:w-[340px]">
      {metaTop ? meta : person}
      <p className="mt-4 text-sm leading-relaxed text-foreground/90">
        {highlightMentions(t.quote)}
      </p>
      <div className="mt-5">{metaTop ? person : meta}</div>
    </article>
  );
}

// Keep the same on-screen speed regardless of how many cards a row has, and
// repeat the set enough times that one copy always overflows the viewport —
// this removes the visible blank gap at the start/loop point.
const SECONDS_PER_CARD = 6;
const MIN_CARDS = 8;

function fill(items: TestimonialDoc[]) {
  if (!items.length) return items;
  const out: TestimonialDoc[] = [];
  while (out.length < MIN_CARDS) out.push(...items);
  return out;
}

function MarqueeRow({ items, reverse }: { items: TestimonialDoc[]; reverse?: boolean }) {
  const filled = fill(items);
  const loop = [...filled, ...filled];
  const duration = filled.length * SECONDS_PER_CARD;
  return (
    <div className="relative overflow-hidden">
      <div
        className={cn(
          "flex w-max gap-4 py-2",
          reverse ? "animate-marquee-reverse" : "animate-marquee",
        )}
        style={{ animationDuration: `${duration}s` }}
      >
        {loop.map((t, i) => (
          <Card key={`${t._id}-${i}`} t={t} />
        ))}
      </div>
    </div>
  );
}

export function TestimonialsMarquee({
  items,
  eyebrow,
  title,
}: {
  items: TestimonialDoc[];
  eyebrow?: string;
  title?: string;
}) {
  if (!items.length) return null;
  const row1 = items.filter((t) => (t.row || 1) === 1);
  const row2 = items.filter((t) => t.row === 2);
  const a = row1.length ? row1 : items.slice(0, Math.ceil(items.length / 2));
  const b = row2.length ? row2 : items.slice(Math.ceil(items.length / 2));

  return (
    <section className="overflow-hidden border-y border-border/60 bg-background py-14 md:py-20 dark:bg-[oklch(0.16_0_0)]">
      <div className="mx-auto max-w-[1440px] px-4 md:px-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {eyebrow || "Verified purchasers"}
        </p>
        <h2 className="mt-2 text-3xl md:text-4xl">{title || "What owners report"}</h2>
      </div>
      <div className="mt-10 space-y-4">
        <MarqueeRow items={a.length ? a : items} />
        <MarqueeRow items={b.length ? b : items} reverse />
      </div>
    </section>
  );
}
