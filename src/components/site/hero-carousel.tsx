import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, Parallax } from "swiper/modules";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import { mediaUrl } from "@/lib/api";

import "swiper/css";

export type HeroSlide = {
  image: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
};

/* ─── Premium cubic-bezier: fast start, silky deceleration ─── */
const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const TEXT_EASE = [0.16, 1, 0.3, 1] as const;

/* ─── Word-by-word blur-up title reveal ─── */
function AnimatedTitle({ text, reduce }: { text: string; reduce: boolean | null }) {
  const lines = text.split("\n");
  let wi = 0;
  return (
    <h1 className="text-[12vw] font-semibold leading-[0.92] tracking-[-0.03em] text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]">
      {lines.map((line, li) => (
        <span key={li} className="block overflow-hidden pb-[0.06em]">
          {line.split(" ").map((word) => {
            const delay = 0.22 + wi * 0.07;
            wi += 1;
            return (
              <motion.span
                key={`${li}-${wi}`}
                className="mr-[0.22em] inline-block will-change-transform"
                initial={
                  reduce
                    ? { opacity: 0 }
                    : { opacity: 0, y: "1em", filter: "blur(12px)" }
                }
                animate={
                  reduce
                    ? { opacity: 1 }
                    : { opacity: 1, y: 0, filter: "blur(0px)" }
                }
                transition={{
                  duration: reduce ? 0.25 : 0.9,
                  delay: reduce ? 0 : delay,
                  ease: TEXT_EASE,
                }}
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

/* ─── Main carousel ─── */
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
  const swiperRef = useRef<SwiperType | null>(null);
  const [active, setActive] = useState(0);

  if (count === 0) return null;

  const delayMs = Math.max(3000, (Number(autoplaySeconds) || 5) * 1000);
  const slide = valid[active];

  /* Format counter e.g. "01 / 03" */
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section
      className="relative h-[82svh] max-h-[860px] min-h-[480px] w-full overflow-hidden bg-black"
      aria-roledescription="carousel"
      aria-live="polite"
    >
      {/* ── Swiper ── */}
      <Swiper
        modules={[Autoplay, Parallax]}
        parallax
        speed={reduce ? 400 : 1100}
        loop={count > 1}
        autoplay={
          count > 1
            ? { delay: delayMs, disableOnInteraction: false, pauseOnMouseEnter: false }
            : false
        }
        allowTouchMove={false}
        onSwiper={(s) => (swiperRef.current = s)}
        onSlideChange={(s) => setActive(s.realIndex)}
        className="absolute inset-0 h-full w-full"
        style={{ "--swiper-transition-timing-function": `cubic-bezier(${EASE.join(",")})` } as React.CSSProperties}
      >
        {valid.map((sl, i) => (
          <SwiperSlide key={i} className="relative overflow-hidden">
            {/* Parallax image layer — 130% wide so parallax never shows gaps */}
            <div
              className="absolute inset-0 overflow-hidden"
              data-swiper-parallax="-20%"
              style={{ width: "130%", left: "-15%" }}
            >
              {sl.image ? (
                <img
                  src={mediaUrl(sl.image)}
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
            </div>

            {/* Cinematic gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Subtle grain for premium texture */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: "200px 200px",
              }}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* ── Text overlay ── */}
      <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-end px-6 pb-20 md:px-12 md:pb-24 lg:px-16">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div key={`copy-${active}`} className="space-y-5">
              {slide.eyebrow && (
                <motion.p
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: TEXT_EASE }}
                  className="inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.38em] text-white/70"
                >
                  <span className="h-px w-10 bg-white/50" />
                  {slide.eyebrow}
                </motion.p>
              )}

              {slide.title && <AnimatedTitle text={slide.title} reduce={reduce} />}

              {slide.subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, delay: 0.55, ease: TEXT_EASE }}
                  className="max-w-lg text-[15px] leading-relaxed text-white/75 md:text-base"
                >
                  {slide.subtitle}
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Bottom HUD: counter + indicators + progress bar ── */}
        {count > 1 && (
          <div className="mt-10 flex items-end justify-between">
            {/* Line indicators */}
            <div className="flex items-center gap-2">
              {valid.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => swiperRef.current?.slideToLoop(i)}
                  className="pointer-events-auto h-[2px] rounded-full transition-all duration-500"
                  style={{
                    width: i === active ? "40px" : "14px",
                    background: i === active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.28)",
                  }}
                />
              ))}
            </div>

            {/* Slide counter */}
            <p className="pointer-events-none font-mono text-[10px] tracking-[0.22em] text-white/40">
              {pad(active + 1)}{" "}
              <span className="text-white/20">/</span>{" "}
              {pad(count)}
            </p>
          </div>
        )}
      </div>

      {/* ── Auto-play progress line ── */}
      {count > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 h-[1.5px] bg-white/10">
          <motion.div
            key={`bar-${active}`}
            className="h-full bg-white/50"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: delayMs / 1000, ease: "linear" }}
          />
        </div>
      )}
    </section>
  );
}
