import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const FALLBACK_TEXT = "Free shipping over Rs 20,000 · Cash on Delivery available";
const FALLBACK_EMOJIS = ["🎉", "😊", "✨"];

function bounceClass(i: number) {
  const variants = ["animate-announcement-bounce", "animate-announcement-bounce-delay", "animate-announcement-wiggle"];
  return variants[i % variants.length];
}

function MarqueeChunk({
  text,
  emojis,
}: {
  text: string;
  emojis: string[];
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-3 px-6">
      {emojis.map((emoji, i) => (
        <span
          key={`${emoji}-${i}-a`}
          className={cn("inline-block text-base leading-none", bounceClass(i))}
          aria-hidden
        >
          {emoji}
        </span>
      ))}
      <span>{text}</span>
      {emojis.map((emoji, i) => (
        <span
          key={`${emoji}-${i}-b`}
          className={cn("inline-block text-base leading-none", bounceClass(i + 1))}
          aria-hidden
        >
          {emoji}
        </span>
      ))}
      <span className="opacity-40" aria-hidden>
        ·
      </span>
    </span>
  );
}

export function AnnouncementMarquee() {
  const { settings } = useStore();
  const text = (settings?.announcement || FALLBACK_TEXT).trim() || FALLBACK_TEXT;
  const emojis = Array.isArray(settings?.announcementEmojis)
    ? settings.announcementEmojis
    : FALLBACK_EMOJIS;
  const speed = Math.max(12, Number(settings?.announcementSpeed) || 28);

  // Repeat enough copies so a continuous loop never shows a blank gap.
  const copies = useMemo(() => Array.from({ length: 6 }, (_, i) => i), []);

  return (
    <div className="band overflow-hidden bg-ink py-2 text-paper dark:bg-[oklch(0.2_0_0)]">
      <div
        className="flex w-max animate-announcement-marquee font-mono text-[10px] uppercase tracking-[0.2em]"
        style={{ animationDuration: `${speed}s` }}
      >
        {copies.map((i) => (
          <MarqueeChunk key={i} text={text} emojis={emojis} />
        ))}
      </div>
    </div>
  );
}
