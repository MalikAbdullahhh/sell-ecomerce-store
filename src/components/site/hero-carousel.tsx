import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { mediaUrl } from "@/lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  if (count === 0) return null;

  const active = valid[currentIndex];
  const isLight = active.theme === "light";

  // Handle Autoplay & Progress Ticks
  useEffect(() => {
    if (count <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalTime = 100; // Tick every 100ms
    const totalDuration = autoplaySeconds * 1000;
    const increment = (intervalTime / totalDuration) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setDirection(1);
          setCurrentIndex((current) => (current + 1) % count);
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, isPaused, autoplaySeconds, currentIndex]);

  const handleNext = () => {
    setDirection(1);
    setProgress(0);
    setCurrentIndex((current) => (current + 1) % count);
  };

  const handlePrev = () => {
    setDirection(-1);
    setProgress(0);
    setCurrentIndex((current) => (current - 1 + count) % count);
  };

  const handleSelect = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setProgress(0);
    setCurrentIndex(index);
  };

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
            {/* ── Main Layout Grid ── */}
            <div className="relative z-10 mx-auto grid h-full max-w-[1440px] grid-cols-1 md:grid-cols-12 md:gap-8 px-6 md:px-12 items-center">
              
              {/* ── Copy Block (Staggered slide up) ── */}
              <div className="col-span-1 md:col-span-5 flex flex-col justify-center order-2 md:order-1 pt-4 md:pt-0 pb-12 md:pb-0 z-20">
                {active.eyebrow && (
                  <motion.p
                    initial={{ y: 15 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
                    className={`mb-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.35em] ${
                      isLight ? "text-neutral-500" : "text-neutral-400"
                    }`}
                  >
                    <span className={`h-px w-6 ${isLight ? "bg-neutral-300" : "bg-neutral-700"}`} />
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
                      className={`mt-4 max-w-md text-sm md:text-base font-light leading-relaxed ${
                        isLight ? "text-neutral-600" : "text-neutral-300"
                      }`}
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
                      className={`group inline-flex items-center justify-center px-6 py-3 border text-xs uppercase tracking-[0.2em] transition-all duration-300 ${
                        isLight
                          ? "border-neutral-900 bg-neutral-900 text-neutral-50 hover:bg-transparent hover:text-neutral-900"
                          : "border-neutral-50 bg-neutral-50 text-neutral-900 hover:bg-transparent hover:text-neutral-50"
                      }`}
                    >
                      {active.linkText}
                    </Link>
                  </motion.div>
                )}
              </div>

              {/* ── Image Block (Rendered fully in original dimensions, contained nicely) ── */}
              <div className="col-span-1 md:col-span-7 flex items-center justify-center order-1 md:order-2 h-full relative px-4 md:px-8">
                {active.image ? (
                  <div className="relative flex items-center justify-center w-full h-full max-h-[70vh]">
                    <img
                      src={mediaUrl(active.image)}
                      alt={active.title || ""}
                      className="max-h-full max-w-full w-auto h-auto object-contain select-none"
                      draggable={false}
                      fetchPriority="high"
                    />
                  </div>
                ) : (
                  <div className={`w-3/4 h-3/4 border border-dashed rounded ${
                    isLight ? "border-neutral-200" : "border-neutral-800"
                  }`} />
                )}
              </div>

            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Minimal, Elegant UI Controls ── */}
      <div className="absolute bottom-8 left-0 right-0 z-30 mx-auto max-w-[1440px] px-6 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Slide Counter (Elegant Serif) */}
        <div className={`font-serif italic text-sm tracking-widest ${isLight ? "text-neutral-400" : "text-neutral-500"}`}>
          <span className={isLight ? "text-neutral-900" : "text-neutral-50"}>
            {String(currentIndex + 1).padStart(2, "0")}
          </span>
          <span className="mx-2">/</span>
          <span>{String(count).padStart(2, "0")}</span>
        </div>

        {/* Thin-line Progress Indicators */}
        {count > 1 && (
          <div className="flex items-center gap-3 w-full md:max-w-md">
            {valid.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                className="group relative py-3 flex-1 focus:outline-none"
                aria-label={`Go to slide ${idx + 1}`}
              >
                <div
                  className={`h-[1px] w-full transition-colors duration-300 ${
                    isLight ? "bg-neutral-200 group-hover:bg-neutral-400" : "bg-neutral-800 group-hover:bg-neutral-600"
                  }`}
                >
                  {currentIndex === idx && (
                    <motion.div
                      className={`h-full ${isLight ? "bg-neutral-900" : "bg-neutral-50"}`}
                      style={{ width: `${progress}%` }}
                      layoutId="activeProgress"
                      transition={{ ease: "linear" }}
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Hover Navigation Controls */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={handlePrev}
            className={`p-3 rounded-full border transition-all duration-300 ${
              isLight
                ? "border-neutral-200 hover:border-neutral-900 text-neutral-400 hover:text-neutral-900"
                : "border-neutral-800 hover:border-neutral-50 text-neutral-500 hover:text-neutral-50"
            }`}
            aria-label="Previous slide"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={handleNext}
            className={`p-3 rounded-full border transition-all duration-300 ${
              isLight
                ? "border-neutral-200 hover:border-neutral-900 text-neutral-400 hover:text-neutral-900"
                : "border-neutral-800 hover:border-neutral-50 text-neutral-500 hover:text-neutral-50"
            }`}
            aria-label="Next slide"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </section>
  );
}
