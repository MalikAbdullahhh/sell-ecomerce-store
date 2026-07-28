import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCreative } from "swiper/modules";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { mediaUrl } from "@/lib/api";

// Swiper core + modules styles
import "swiper/css";
import "swiper/css/effect-creative";

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
    <h1 className="text-[13vw] font-semibold leading-[0.95] tracking-[-0.03em] text-white sm:text-6xl md:text-7xl lg:text-8xl">
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
  const [activeIndex, setActiveIndex] = useState(0);

  if (count === 0) return null;

  const delayMs = Math.max(3000, (Number(autoplaySeconds) || 5) * 1000);
  const active = valid[activeIndex];

  return (
    <section
      className="relative h-[82svh] max-h-[860px] min-h-[480px] w-full overflow-hidden bg-neutral-950 text-white"
      aria-roledescription="carousel"
      aria-live="polite"
    >
      {/* ── Swiper: cinematic right-to-left slide ── */}
      <Swiper
        modules={[Autoplay, EffectCreative]}
        effect="creative"
        creativeEffect={{
          prev: {
            // Exiting slide: moves left and fades out
            translate: ["-110%", 0, -1],
            opacity: 0,
          },
          next: {
            // Incoming slide: starts from the right
            translate: ["100%", 0, 0],
            opacity: 1,
          },
        }}
        speed={reduce ? 350 : 900}
        loop={count > 1}
        autoplay={
          count > 1
            ? { delay: delayMs, disableOnInteraction: false }
            : false
        }
        allowTouchMove={false}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="absolute inset-0 h-full w-full"
      >
        {valid.map((slide, i) => (
          <SwiperSlide key={i} className="relative h-full w-full">
            {slide.image ? (
              <img
                src={mediaUrl(slide.image)}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding={i === 0 ? "sync" : "async"}
                loading={i === 0 ? "eager" : "lazy"}
              />
            ) : (
              <div className="h-full w-full bg-neutral-900" />
            )}
            {/* Dark gradient overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* ── Text overlay ── */}
      <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-end px-5 pb-16 md:px-10 md:pb-20">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div key={`copy-${activeIndex}`}>
              {active.eyebrow && (
                <motion.p
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.12, ease: EASE }}
                  className="mb-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.32em] text-white"
                >
                  <span className="h-px w-8 bg-white/80" />
                  {active.eyebrow}
                </motion.p>
              )}

              {active.title && <AnimatedTitle text={active.title} reduce={reduce} />}

              {active.subtitle && (
                <motion.p
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.5, ease: EASE }}
                  className="mt-6 max-w-xl text-base text-white md:text-lg"
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
