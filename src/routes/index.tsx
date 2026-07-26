import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Instagram, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { Brackets, Eyebrow, FocusIn, Stars, Tag } from "@/components/site/focus";
import { ProductCard } from "@/components/site/product-card";
import { Rail, RailItem, Section, SectionHead } from "@/components/site/rail";
import { categories, instagramShots, products, testimonials } from "@/data/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aperture — Precision Tech, Strictly Monochrome" },
      {
        name: "description",
        content:
          "Audio, wearables, smart home and desk hardware built to published tolerances. Free shipping over $75, Cash on Delivery available.",
      },
      { property: "og:title", content: "Aperture — Precision Tech, Strictly Monochrome" },
      {
        property: "og:description",
        content: "Precision consumer electronics built in small runs and documented in full.",
      },
    ],
  }),
  component: Index,
});

const hero = products[0];

function Countdown() {
  const [left, setLeft] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const end = Date.now() + 1000 * 60 * 60 * 9.5;
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
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="font-mono text-2xl tracking-[0.1em] md:text-3xl">
      {pad(left.h)}:{pad(left.m)}:{pad(left.s)}
    </span>
  );
}

function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 pb-14 pt-8 md:grid-cols-2 md:items-center md:px-10 md:pb-24 md:pt-14">
        <div className="order-2 md:order-1">
          <Eyebrow>Aperture One / Gen 3</Eyebrow>
          <motion.h1
            initial={reduce ? { opacity: 0 } : { clipPath: "inset(0 100% 0 0)", opacity: 1 }}
            animate={reduce ? { opacity: 1 } : { clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: reduce ? 0.3 : 1.1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3 text-[13vw] leading-[0.92] sm:text-6xl md:text-7xl"
          >
            −42dB of
            <br />
            nothing at all.
          </motion.h1>
          <FocusIn delay={0.6}>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              A 12mm graphene driver, a four-mic adaptive array sampling at 48kHz, and 32 hours in a milled
              aluminium case. Measured, published, and boxed like an instrument.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                to="/product/$slug"
                params={{ slug: hero.slug }}
                className="grid h-13 min-h-12 place-items-center bg-foreground px-8 font-mono text-xs uppercase tracking-[0.22em] text-background transition-colors hover:bg-background hover:text-foreground hover:ring-1 hover:ring-foreground"
              >
                Configure Aperture One
              </Link>
              <span className="font-mono text-xs text-muted-foreground">$249 · was $299</span>
            </div>
          </FocusIn>
        </div>

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(24px)", scale: 1.06 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, filter: "blur(0px)", scale: 1 }}
          transition={{ duration: reduce ? 0.3 : 1.3, ease: [0.16, 1, 0.3, 1] }}
          className="crosshair relative order-1 aspect-[4/5] w-full overflow-hidden border border-border bg-secondary md:order-2 md:aspect-[4/4.4]"
        >
          <img
            src={hero.images[0]}
            alt="Aperture One earbuds and charging case"
            className="h-full w-full object-cover"
          />
          <Brackets size={34} className="text-foreground" />
          <div className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.2em]">
            f/1.4 · 12mm · IPX5
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Index() {
  const trending = products.filter((p) => p.flags.includes("hot") || p.rating >= 4.6).slice(0, 8);
  const arrivals = products.slice(0, 8);

  return (
    <>
      <Hero />

      {/* Flash sale */}
      <section className="bg-foreground text-background">
        <div className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-6 md:px-10">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">Limited run · 200 units</p>
            <p className="mt-1 truncate text-lg md:text-xl">Gen 2 stock clearing at −20%</p>
          </div>
          <Countdown />
        </div>
      </section>

      {/* Trending */}
      <Section>
        <SectionHead
          eyebrow="Moving fastest this week"
          title="Trending now"
          action={
            <Link to="/shop" className="border-b border-foreground pb-1 font-mono text-[11px] uppercase tracking-[0.2em]">
              View all
            </Link>
          }
        />
        <Rail>
          {trending.map((p) => (
            <RailItem key={p.slug}>
              <ProductCard product={p} />
            </RailItem>
          ))}
        </Rail>
      </Section>

      {/* Categories */}
      <Section invert>
        <SectionHead eyebrow="Six disciplines" title="Shop by category" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {categories.map((c) => (
            <FocusIn key={c.slug}>
              <Link
                to="/shop"
                search={{ category: c.slug }}
                className="crosshair group relative block aspect-[4/3] overflow-hidden border border-background/25"
              >
                <img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-foreground/45" />
                <div className="absolute bottom-3 left-3">
                  <p className="text-lg text-background">{c.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/70">{c.blurb}</p>
                </div>
              </Link>
            </FocusIn>
          ))}
        </div>
      </Section>

      {/* New arrivals */}
      <Section>
        <SectionHead
          eyebrow="Latest into the catalogue"
          title="New arrivals"
          action={
            <Link to="/shop" className="border-b border-foreground pb-1 font-mono text-[11px] uppercase tracking-[0.2em]">
              View all
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {arrivals.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </Section>

      {/* Brand story */}
      <Section invert>
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <FocusIn className="crosshair relative aspect-[4/3] overflow-hidden border border-background/25">
            <img
              src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80"
              alt="Aperture workshop bench"
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <Brackets size={26} className="text-background" />
          </FocusIn>
          <FocusIn delay={0.1}>
            <Eyebrow className="text-background">Est. 2019 · Rotterdam</Eyebrow>
            <h2 className="mt-3 text-3xl md:text-4xl">Precision is a number you can check.</h2>
            <p className="mt-4 max-w-md opacity-75">
              We publish tolerances, measured curves and battery figures taken under load, not under ideal
              conditions. Every product ships with the datasheet it was tested against.
            </p>
            <Link
              to="/about"
              className="mt-6 inline-block border-b border-background pb-1 font-mono text-[11px] uppercase tracking-[0.2em]"
            >
              Read the full story
            </Link>
          </FocusIn>
        </div>
      </Section>

      {/* Value strip */}
      <section className="border-y border-border bg-background">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
          {[
            { icon: Truck, t: "Free shipping", s: "Orders over $75" },
            { icon: PackageCheck, t: "Cash on Delivery", s: "Domestic up to $600" },
            { icon: RotateCcw, t: "30-day returns", s: "We cover faults" },
            { icon: ShieldCheck, t: "1-year warranty", s: "3 years if registered" },
          ].map(({ icon: Icon, t, s }) => (
            <div key={t} className="flex items-center gap-3 px-4 py-6 md:px-8">
              <Icon width={20} height={20} strokeWidth={1.4} className="shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <Section>
        <SectionHead eyebrow="Verified purchasers" title="What owners report" />
        <Rail>
          {testimonials.map((t) => (
            <div key={t.name} className="w-[80vw] shrink-0 snap-start border border-border p-6 sm:w-[46vw] md:w-[360px]">
              <Stars rating={t.rating} size={13} />
              <p className="mt-4 text-[15px] leading-relaxed">"{t.quote}"</p>
              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {t.name} · {t.role}
              </p>
            </div>
          ))}
        </Rail>
      </Section>

      {/* UGC */}
      <Section invert>
        <SectionHead eyebrow="@aperture.instruments" title="In the field" />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {instagramShots.map((src, i) => (
            <FocusIn key={src} delay={i * 0.03} className="crosshair group relative aspect-square overflow-hidden">
              <img
                src={src}
                alt="Customer photo"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <Instagram
                width={15}
                height={15}
                className="absolute right-2 top-2 text-background opacity-0 transition-opacity group-hover:opacity-100"
              />
            </FocusIn>
          ))}
        </div>
      </Section>

      {/* Aggregate rating */}
      <Section className="text-center">
        <FocusIn>
          <p className="font-display text-[22vw] leading-none md:text-[10rem]">4.7</p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <Stars rating={4.7} size={16} />
            <span className="font-mono text-xs uppercase tracking-[0.2em]">2,495 reviews</span>
          </div>
        </FocusIn>
      </Section>

      {/* Newsletter */}
      <Section invert className="text-center">
        <FocusIn>
          <Tag className="bg-background text-foreground">10% off your first order</Tag>
          <h2 className="mx-auto mt-5 max-w-xl text-3xl md:text-4xl">
            One email a month. Measurements, not marketing.
          </h2>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-7 flex max-w-md flex-col gap-2 sm:flex-row"
          >
            <input
              type="email"
              required
              placeholder="you@domain.com"
              className="h-12 flex-1 border border-background/40 bg-transparent px-4 font-mono text-sm outline-none placeholder:text-background/40 focus:border-background"
            />
            <button className="h-12 bg-background px-6 font-mono text-xs uppercase tracking-[0.22em] text-foreground">
              Subscribe
            </button>
          </form>
        </FocusIn>
      </Section>
    </>
  );
}
