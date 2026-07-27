import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Instagram, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Brackets, Eyebrow, FocusIn, Stars, Tag } from "@/components/site/focus";
import { CmsIcon } from "@/components/site/cms-icon";
import { HeroCarousel, type HeroSlide } from "@/components/site/hero-carousel";
import { ProductCard } from "@/components/site/product-card";
import { Rail, RailItem, Section, SectionHead } from "@/components/site/rail";
import { money, useStore } from "@/lib/store";
import { cmsApi, mediaUrl, newsletterApi, type TestimonialDoc } from "@/lib/api";
import { usePageContent } from "@/lib/page-content";
import { fillTokens } from "@/lib/page-schema";
import { TestimonialsMarquee } from "@/components/site/testimonials-marquee";
import { PageSkeleton } from "@/components/site/skeletons";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Genz Gadgets PK — Precision Tech, Strictly Monochrome" },
      {
        name: "description",
        content:
          "Audio, wearables, smart home and desk hardware built to published tolerances. Free shipping over $75, Cash on Delivery available.",
      },
      { property: "og:title", content: "Genz Gadgets PK — Precision Tech, Strictly Monochrome" },
      {
        property: "og:description",
        content: "Precision consumer electronics built in small runs and documented in full.",
      },
    ],
  }),
  component: Index,
});

function Countdown({ hours = 9.5 }: { hours?: number }) {
  const [left, setLeft] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const end = Date.now() + 1000 * 60 * 60 * (Number(hours) || 9.5);
    const tick = () => {
      const d = Math.max(0, end - Date.now());
      setLeft({
        h: Math.floor(d / 3600000),
        m: Math.floor((d % 3600000) / 60000),
        s: Math.floor((d % 60000) / 1000),
      });
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [hours]);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="font-mono text-2xl tracking-[0.1em] md:text-3xl">
      {pad(left.h)}:{pad(left.m)}:{pad(left.s)}
    </span>
  );
}

type HeroContent = {
  autoplaySeconds: number;
  slides: HeroSlide[];
};

function AggregateRating({
  rating,
  reviews,
  eyebrow,
  reviewsLabel,
}: {
  rating: number;
  reviews: number;
  eyebrow: string;
  reviewsLabel: string;
}) {
  const reduce = useReducedMotion();
  // Decorative stars floating in the background, deterministic layout.
  const floaters = [
    { left: "8%", top: "22%", size: 26, delay: 0 },
    { left: "18%", top: "68%", size: 18, delay: 0.6 },
    { left: "30%", top: "18%", size: 14, delay: 1.2 },
    { left: "72%", top: "24%", size: 22, delay: 0.3 },
    { left: "84%", top: "62%", size: 28, delay: 0.9 },
    { left: "62%", top: "72%", size: 16, delay: 1.5 },
    { left: "50%", top: "12%", size: 12, delay: 0.45 },
  ];

  return (
    <section className="relative overflow-hidden bg-background text-foreground">
      {/* Animated gradient glow */}
      {!reduce && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          {floaters.map((f, i) => (
            <motion.div
              key={i}
              aria-hidden
              className="pointer-events-none absolute text-primary/25"
              style={{ left: f.left, top: f.top }}
              animate={{ y: [0, -14, 0], rotate: [0, 12, 0], opacity: [0.3, 0.7, 0.3] }}
              transition={{
                duration: 5 + (i % 3),
                repeat: Infinity,
                ease: "easeInOut",
                delay: f.delay,
              }}
            >
              <Star width={f.size} height={f.size} fill="currentColor" strokeWidth={0} />
            </motion.div>
          ))}
        </>
      )}

      <div className="relative mx-auto max-w-[1440px] px-4 py-20 text-center md:px-10 md:py-28">
        <FocusIn>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            {eyebrow}
          </p>
          <motion.p
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85, filter: "blur(12px)" }}
            whileInView={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="premium-text mt-3 font-display text-[24vw] leading-[0.85] md:text-[11rem]"
          >
            {rating.toFixed(1)}
          </motion.p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Stars rating={rating} size={18} />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {reviews.toLocaleString("en-PK")} {reviewsLabel}
            </span>
          </div>
        </FocusIn>
      </div>
    </section>
  );
}

type Band = { visible: boolean; eyebrow: string; title: string };

function Index() {
  const {
    products: liveProducts,
    settings,
    catalogLoading,
    categories: liveCategories,
  } = useStore();
  const { section, loaded: pageLoaded } = usePageContent("home");

  const hero = section<HeroContent>("hero");
  const flash = section<Band & { showCountdown: boolean; countdownHours: number }>("flashSale");
  const trendingBand = section<Band & { actionLabel: string }>("trending");
  const categoriesBand = section<Band>("categories");
  const arrivalsBand = section<Band & { actionLabel: string }>("arrivals");
  const story = section<Band & { body: string; linkLabel: string; image: string }>("brandStory");
  const promises = section<{
    visible: boolean;
    items: { icon: string; title: string; subtitle: string }[];
  }>("valueStrip");
  const ugc = section<Band>("ugc");
  const ratingBand = section<Band & { reviewsLabel: string }>("rating");
  const catalogue = liveProducts;
  const cats = liveCategories.map((c) => ({
    slug: c.slug,
    name: c.name,
    blurb: c.blurb || "",
    image: c.image ? mediaUrl(c.image) : "",
  }));
  const trending = catalogue.filter((p) => p.flags.includes("hot") || p.rating >= 4.6).slice(0, 8);
  const arrivals = catalogue.slice(0, 8);
  const [testimonials, setTestimonials] = useState<TestimonialDoc[]>([]);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    cmsApi
      .testimonials()
      .then((d) => setTestimonials(d.testimonials))
      .catch(() => setTestimonials([]));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#newsletter") return;
    const t = window.setTimeout(() => {
      document.getElementById("newsletter")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [catalogLoading, settings]);

  if (catalogLoading || !pageLoaded) return <PageSkeleton />;

  const heroSlides = (hero.slides || []).filter((s) => s.image || s.title);
  const promiseItems = (promises.items || []).filter((i) => i.title?.trim());

  return (
    <>
      <HeroCarousel slides={heroSlides} autoplaySeconds={hero.autoplaySeconds} />

      {/* Flash sale */}
      {flash.visible !== false && (flash.title?.trim() || flash.eyebrow?.trim()) && (
        <section className="band mt-8 bg-[linear-gradient(125deg,oklch(0.26_0.07_30),oklch(0.2_0.025_32)_48%,oklch(0.28_0.1_28))] text-paper md:mt-12">
          <div className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-6 md:px-10">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/55">
                {flash.eyebrow}
              </p>
              <p className="premium-text mt-1 truncate text-lg md:text-xl">{flash.title}</p>
            </div>
            {flash.showCountdown !== false && <Countdown hours={flash.countdownHours} />}
          </div>
        </section>
      )}

      {/* Trending */}
      {trendingBand.visible !== false && (
        <Section>
          <SectionHead
            eyebrow={trendingBand.eyebrow}
            title={trendingBand.title}
            action={
              <Link
                to="/shop"
                className="border-b border-foreground pb-1 font-mono text-[11px] uppercase tracking-[0.2em]"
              >
                {trendingBand.actionLabel}
              </Link>
            }
          />
          <Rail resetKey={trending.map((p) => p.slug).join("|") || "trending-empty"}>
            {trending.map((p) => (
              <RailItem key={p.slug}>
                <ProductCard product={p} />
              </RailItem>
            ))}
          </Rail>
        </Section>
      )}

      {/* Categories */}
      {categoriesBand.visible !== false && (
        <Section invert>
          <SectionHead eyebrow={categoriesBand.eyebrow} title={categoriesBand.title} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {cats.map((c) => (
              <FocusIn key={c.slug}>
                <Link
                  to="/shop"
                  search={{ category: c.slug }}
                  className="crosshair group relative block aspect-[4/3] overflow-hidden border border-white/20"
                >
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/50 transition-colors group-hover:bg-black/40" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-lg text-paper">{c.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/70">
                      {c.blurb}
                    </p>
                  </div>
                </Link>
              </FocusIn>
            ))}
          </div>
        </Section>
      )}

      {/* New arrivals */}
      {arrivalsBand.visible !== false && (
        <Section>
          <SectionHead
            eyebrow={arrivalsBand.eyebrow}
            title={arrivalsBand.title}
            action={
              <Link
                to="/shop"
                className="border-b border-foreground pb-1 font-mono text-[11px] uppercase tracking-[0.2em]"
              >
                {arrivalsBand.actionLabel}
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {arrivals.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </Section>
      )}

      {/* Brand story */}
      {story.visible !== false && (story.image || story.title?.trim() || story.body?.trim()) && (
        <Section invert>
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            {story.image ? (
              <FocusIn className="crosshair relative aspect-[4/3] overflow-hidden border border-white/20">
                <img
                  src={mediaUrl(story.image)}
                  alt={story.title || "Brand story"}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <Brackets size={26} className="text-paper" />
              </FocusIn>
            ) : null}
            <FocusIn delay={0.1}>
              {story.eyebrow ? <Eyebrow className="text-paper/70">{story.eyebrow}</Eyebrow> : null}
              {story.title ? <h2 className="mt-3 text-3xl md:text-4xl">{story.title}</h2> : null}
              {story.body ? <p className="mt-4 max-w-md text-paper/75">{story.body}</p> : null}
              <Link
                to="/about"
                className="mt-6 inline-block border-b border-paper pb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-paper"
              >
                {story.linkLabel || "Read the full story"}
              </Link>
            </FocusIn>
          </div>
        </Section>
      )}

      {/* Value strip */}
      {promises.visible !== false && promiseItems.length > 0 && (
        <section className="border-y border-border bg-background">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
            {promiseItems.map((item, i) => (
              <div key={`${item.title}-${i}`} className="flex items-center gap-3 px-4 py-6 md:px-8">
                <CmsIcon name={item.icon} className="shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {fillTokens(item.subtitle || "", {
                      freeShipping: money(settings?.shipping?.freeThreshold ?? 20000),
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <TestimonialsMarquee
        items={testimonials}
        eyebrow={settings?.testimonialsSection?.eyebrow}
        title={settings?.testimonialsSection?.title}
      />

      {/* UGC */}
      {ugc.visible !== false && (
        <Section invert>
          <SectionHead eyebrow={ugc.eyebrow} title={ugc.title} />
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {(settings?.instagramShots || []).map((src, i) => (
              <FocusIn
                key={src}
                delay={i * 0.03}
                className="crosshair group relative aspect-square overflow-hidden"
              >
                <img
                  src={mediaUrl(src)}
                  alt="Customer photo"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <Instagram
                  width={15}
                  height={15}
                  className="absolute right-2 top-2 text-paper opacity-0 transition-opacity group-hover:opacity-100"
                />
              </FocusIn>
            ))}
          </div>
        </Section>
      )}

      {/* Aggregate rating */}
      {ratingBand.visible !== false && (
        <AggregateRating
          rating={catalogue.reduce((s, p) => s + p.rating, 0) / Math.max(1, catalogue.length)}
          reviews={catalogue.reduce((s, p) => s + p.reviewCount, 0)}
          eyebrow={ratingBand.eyebrow}
          reviewsLabel={ratingBand.reviewsLabel}
        />
      )}

      {/* Newsletter */}
      {settings?.newsletter?.enabled !== false && (
        <Section invert id="newsletter" className="scroll-mt-28 text-center">
          <FocusIn>
            <Tag className="bg-paper text-ink">
              {settings?.newsletter?.eyebrow || "10% off your first order"}
            </Tag>
            <h2 className="mx-auto mt-5 max-w-xl text-3xl md:text-4xl">
              {settings?.newsletter?.headline || "One email a month. Measurements, not marketing."}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmitting(true);
                try {
                  await newsletterApi.subscribe({ email });
                  toast.success(settings?.newsletter?.successMessage || "You're on the list.");
                  setEmail("");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not subscribe");
                } finally {
                  setSubmitting(false);
                }
              }}
              className="mx-auto mt-7 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:gap-2"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="box-border min-h-14 w-full min-w-0 flex-1 border border-white/30 bg-white/5 px-4 font-mono text-base leading-normal text-paper outline-none placeholder:text-paper/45 focus:border-paper sm:min-h-12 sm:text-sm"
              />
              <button
                disabled={submitting}
                className="glass-sweep glass-sweep-ink box-border min-h-14 w-full shrink-0 border border-paper bg-paper px-6 font-mono text-xs uppercase tracking-[0.22em] text-ink disabled:opacity-50 sm:min-h-12 sm:w-auto"
              >
                {submitting ? "…" : settings?.newsletter?.buttonLabel || "Subscribe"}
              </button>
            </form>
          </FocusIn>
        </Section>
      )}
    </>
  );
}
