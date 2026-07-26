import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { mediaUrl } from "@/lib/api";

export type HeroSlide = {
  image: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
};

const EASE = [0.16, 1, 0.3, 1] as const;

/** Title reveal: each word rises and unblurs in sequence, per line. */
function AnimatedTitle({ text, reduce }: { text: string; reduce: boolean | null }) {
  const lines = text.split("\n");
  let wordIndex = 0;

  return (
    <h1 className="text-[13vw] font-semibold leading-[0.95] tracking-[-0.03em] text-white drop-shadow-[0_2px_30px_rgba(0,0,0,0.45)] sm:text-6xl md:text-7xl lg:text-8xl">
      {lines.map((line, li) => (
        <span key={li} className="block overflow-hidden pb-[0.08em]">
          {line.split(" ").map((word) => {
            const delay = 0.28 + wordIndex * 0.08;
            wordIndex += 1;
            return (
              <motion.span
                key={`${word}-${wordIndex}`}
                className="mr-[0.22em] inline-block"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: "0.9em", filter: "blur(10px)" }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: reduce ? 0.3 : 0.85, delay: reduce ? 0 : delay, ease: EASE }}
              >
                {word}
              </motion.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

export function HeroCarousel({
  slides,
  autoplaySeconds = 5,
}: {
  slides: HeroSlide[];
  autoplaySeconds?: number;
}) {
  const reduce = useReducedMotion();
  const valid = slides.filter((s) => s.image || s.title);
  const count = valid.length;

  const [index, setIndex] = useState(0);
  const intervalMs = Math.max(3000, (Number(autoplaySeconds) || 5) * 1000);

  const goNext = useCallback(() => {
    setIndex((i) => (count ? (i + 1) % count : 0));
  }, [count]);

  // Always auto-advance — no pause, no controls.
  useEffect(() => {
    if (count <= 1) return;
    const id = window.setInterval(goNext, intervalMs);
    return () => window.clearInterval(id);
  }, [count, intervalMs, goNext]);

  if (count === 0) return null;

  const active = valid[index];

  return (
    <section
      className="relative h-[82svh] max-h-[860px] min-h-[480px] w-full overflow-hidden bg-neutral-950 text-white"
      aria-roledescription="carousel"
      aria-live="polite"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
          transition={{ duration: reduce ? 0.35 : 1, ease: EASE }}
        >
          <motion.div
            className="absolute inset-0"
            initial={reduce ? {} : { scale: 1.1 }}
            animate={reduce ? {} : { scale: 1.22 }}
            transition={{ duration: intervalMs / 1000 + 0.8, ease: "linear" }}
          >
            {active.image ? (
              <img
                src={mediaUrl(active.image)}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="h-full w-full bg-neutral-900" />
            )}
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_180px_60px_rgba(0,0,0,0.55)]" />

      <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-end px-5 pb-16 md:px-10 md:pb-20">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div key={`copy-${index}`}>
              {active.eyebrow && (
                <motion.p
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.12, ease: EASE }}
                  className="mb-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.32em] text-white/70"
                >
                  <span className="h-px w-8 bg-white/50" />
                  {active.eyebrow}
                </motion.p>
              )}

              {active.title && <AnimatedTitle text={active.title} reduce={reduce} />}

              {active.subtitle && (
                <motion.p
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.5, ease: EASE }}
                  className="mt-6 max-w-xl text-base text-white/80 md:text-lg"
                >
                  {active.subtitle}
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
