import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { mediaUrl } from "@/lib/api";
import { Link } from "@tanstack/react-router";

export type HeroSlide = {
  image: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  linkText?: string;
  theme?: "dark" | "light";
};

const EASE = [0.65, 0, 0.35, 1] as const;

export function HeroCarousel({
  slides,
  autoplaySeconds = 6,
}: {
  slides: HeroSlide[];
  autoplaySeconds?: number;
}) {
  const valid = slides.filter((s) => s.image || s.title);
  const count = valid.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = next, -1 = prev
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  if (count === 0) return null;

  const active = valid[currentIndex];
  const isLight = active.theme === "light";

  // Handle Autoplay Ticks
  useEffect(() => {
    if (count <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalTime = autoplaySeconds * 1000;

    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((current) => (current + 1) % count);
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, isPaused, autoplaySeconds, currentIndex]);

  return (
    <section
      className={`relative h-[85svh] max-h-[900px] min-h-[520px] w-full overflow-hidden transition-colors duration-700 ${
        isLight ? "bg-neutral-50 text-neutral-900" : "bg-neutral-950 text-neutral-50"
      }`}
      aria-roledescription="carousel"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Slide Transitions ── */}
      <div className="absolute inset-0 h-full w-full">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ x: direction * 100 + "%" }}
            animate={{ x: 0 }}
            exit={{ x: -direction * 100 + "%" }}
            transition={{ duration: 0.8, ease: EASE }}
            className="absolute inset-0 h-full w-full"
          >
            {/* ── Background Image taking the entire place ── */}
            {active.image ? (
              <img
                src={mediaUrl(active.image)}
                alt={active.title || ""}
                className="w-full h-full object-cover select-none"
                draggable={false}
                fetchPriority="high"
              />
            ) : (
              <div className={`w-full h-full ${isLight ? "bg-neutral-200" : "bg-neutral-900"}`} />
            )}

            {/* ── Optional Text Overlay (Floating) ── */}
            {(active.eyebrow || active.title || active.subtitle || (active.linkUrl && active.linkText)) && (
              <div className="absolute inset-0 bg-black/10 z-10 flex items-center">
                <div className="mx-auto w-full max-w-[1440px] px-6 md:px-12">
                  <div className="max-w-xl text-white">
                    {active.eyebrow && (
                      <motion.p
                        initial={{ y: 15 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
                        className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.35em] text-white/80"
                      >
                        <span className="h-px w-6 bg-white/50" />
                        {active.eyebrow}
                      </motion.p>
                    )}

                    {active.title && (
                      <h1 className="text-3xl font-light tracking-tight leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl text-balance">
                        {active.title.split("\n").map((line, idx) => (
                          <span key={idx} className="block overflow-hidden py-0.5">
                            <motion.span
                              className="inline-block origin-left"
                              initial={{ y: 30 }}
                              animate={{ y: 0 }}
                              transition={{ duration: 0.7, delay: 0.25 + idx * 0.08, ease: EASE }}
                            >
                              {line}
                            </motion.span>
                          </span>
                        ))}
                      </h1>
                    )}

                    {active.subtitle && (
                      <div className="overflow-hidden">
                        <motion.p
                          initial={{ y: 20 }}
                          animate={{ y: 0 }}
                          transition={{ duration: 0.7, delay: 0.45, ease: EASE }}
                          className="mt-4 text-sm md:text-base font-light leading-relaxed text-white/90"
                        >
                          {active.subtitle}
                        </motion.p>
                      </div>
                    )}

                    {active.linkUrl && active.linkText && (
                      <motion.div
                        initial={{ y: 15 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6, ease: EASE }}
                        className="mt-8"
                      >
                        <Link
                          to={active.linkUrl}
                          className="group inline-flex items-center justify-center px-6 py-3 border border-white bg-white text-neutral-900 text-xs uppercase tracking-[0.2em] transition-all duration-300 hover:bg-transparent hover:text-white"
                        >
                          {active.linkText}
                        </Link>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
