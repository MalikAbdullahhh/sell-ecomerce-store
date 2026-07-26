import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, RotateCcw, ShieldCheck, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Brackets, Eyebrow, Stars, Tag } from "@/components/site/focus";
import { ProductCard } from "@/components/site/product-card";
import { Rail, RailItem, Section, SectionHead } from "@/components/site/rail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getProduct, products, type Product } from "@/data/catalog";
import { GIFT_FEE, money, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Product not found — Aperture" }, { name: "robots", content: "noindex" }] };
    }
    const p = loaderData.product;
    return {
      meta: [
        { title: `${p.name} — ${p.brand} | Aperture` },
        { name: "description", content: p.short },
        { property: "og:title", content: `${p.name} — Aperture` },
        { property: "og:description", content: p.short },
        { property: "og:image", content: p.images[0] },
        { name: "twitter:image", content: p.images[0] },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData() as { product: Product };
  const { addToCart, setCartOpen } = useStore();
  const [color, setColor] = useState(product.colors[0].label);
  const [size, setSize] = useState(product.sizes?.[0]?.label);
  const [qty, setQty] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  const [gift, setGift] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setColor(product.colors[0].label);
    setSize(product.sizes?.[0]?.label);
    setQty(1);
    setImgIndex(0);
  }, [product]);

  useEffect(() => {
    const onScroll = () => {
      const el = galleryRef.current;
      if (!el) return;
      setShowSticky(el.getBoundingClientRect().bottom < 80);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const discount = product.compareAt
    ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
    : 0;
  const related = products.filter((p) => p.slug !== product.slug).slice(0, 6);
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    pct: star === 5 ? 68 : star === 4 ? 22 : star === 3 ? 6 : star === 2 ? 3 : 1,
  }));

  const add = () => {
    addToCart({ slug: product.slug, color, size, qty });
    setCartOpen(true);
    toast(`${product.name} × ${qty} added to cart`);
  };

  return (
    <div>
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 md:px-10">
        <nav className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> /{" "}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-14">
          {/* Gallery */}
          <div ref={galleryRef} className="md:sticky md:top-24 md:self-start">
            <div className="flex gap-3">
              <div className="hidden w-16 shrink-0 flex-col gap-2 md:flex">
                {product.images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setImgIndex(i)}
                    className={cn(
                      "aspect-square overflow-hidden border",
                      i === imgIndex ? "border-foreground" : "border-border opacity-60",
                    )}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="crosshair relative aspect-square w-full overflow-hidden border border-border bg-secondary">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={`${imgIndex}-${color}`}
                    src={product.images[imgIndex]}
                    alt={product.name}
                    initial={{ opacity: 0, filter: "blur(12px)", scale: 1.04 }}
                    animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </AnimatePresence>
                <Brackets size={26} className="text-foreground" />
              </div>
            </div>
            <div className="mt-3 flex justify-center gap-1.5 md:hidden">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  aria-label={`Image ${i + 1}`}
                  onClick={() => setImgIndex(i)}
                  className={cn("h-1.5 w-6", i === imgIndex ? "bg-foreground" : "bg-border")}
                />
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <Eyebrow>
              {product.brand} / {product.category}
            </Eyebrow>
            <h1 className="mt-2 text-4xl md:text-5xl">{product.name}</h1>
            <a href="#reviews" className="mt-3 flex items-center gap-2 text-muted-foreground">
              <Stars rating={product.rating} size={14} />
              <span className="font-mono text-xs underline">{product.reviewCount} reviews</span>
            </a>

            <div className="mt-5 flex items-center gap-3">
              <span className="font-mono text-2xl">{money(product.price)}</span>
              {product.compareAt && (
                <>
                  <span className="font-mono text-sm text-muted-foreground line-through">
                    {money(product.compareAt)}
                  </span>
                  <Tag>Save {discount}%</Tag>
                </>
              )}
            </div>

            <p className="mt-5 max-w-md text-muted-foreground">{product.short}</p>

            {product.stock > 0 && product.stock <= 6 && (
              <p className="mt-4 inline-block bg-foreground px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-background">
                Only {product.stock} left
              </p>
            )}

            {/* Variants */}
            <div className="mt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">Finish</p>
              <div className="mt-3 flex gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setColor(c.label)}
                    className={cn(
                      "flex h-11 items-center gap-2 border px-3 font-mono text-[11px]",
                      color === c.label ? "border-foreground ring-1 ring-foreground" : "border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "h-4 w-4 border border-border",
                        c.id === "ink" ? "bg-foreground" : "bg-secondary",
                      )}
                    />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {product.sizes && (
              <div className="mt-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">Option</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSize(s.label)}
                      className={cn(
                        "h-11 border px-4 font-mono text-[11px] transition-colors",
                        size === s.label
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty + actions */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="flex h-12 items-center border border-border">
                <button aria-label="Decrease" onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-12 w-12 place-items-center">
                  <Minus width={14} height={14} />
                </button>
                <span className="w-8 text-center font-mono text-sm">{qty}</span>
                <button aria-label="Increase" onClick={() => setQty(qty + 1)} className="grid h-12 w-12 place-items-center">
                  <Plus width={14} height={14} />
                </button>
              </div>
              <button
                onClick={add}
                disabled={!product.inStock}
                className="h-12 flex-1 bg-foreground px-8 font-mono text-xs uppercase tracking-[0.22em] text-background disabled:opacity-40"
              >
                {product.inStock ? "Add to cart" : "Sold out"}
              </button>
              <Link
                to="/checkout"
                onClick={add}
                className="grid h-12 flex-1 place-items-center border border-foreground px-8 font-mono text-xs uppercase tracking-[0.22em]"
              >
                Buy now
              </Link>
            </div>

            {/* Gift wrap */}
            <div className="mt-6 border border-border p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-xs">Add gift wrapping (+{money(GIFT_FEE)})</span>
                <Switch checked={gift} onCheckedChange={setGift} />
              </div>
              {gift && <Textarea placeholder="Gift message" className="mt-3 font-mono text-xs" rows={3} />}
            </div>

            <p className="mt-6 font-mono text-xs text-muted-foreground">
              Free delivery by Thu 30 Jul · Cash on Delivery available
            </p>

            <div className="mt-6 grid grid-cols-3 divide-x divide-border border border-border">
              {[
                { icon: Lock, t: "Secure checkout" },
                { icon: RotateCcw, t: "30-day returns" },
                { icon: ShieldCheck, t: "1-year warranty" },
              ].map(({ icon: Icon, t }) => (
                <div key={t} className="flex flex-col items-center gap-2 px-2 py-4 text-center">
                  <Icon width={16} height={16} strokeWidth={1.4} />
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em]">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-20" id="reviews">
          <Tabs defaultValue="description">
            <TabsList className="no-scrollbar h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
              {["description", "specifications", "reviews", "shipping"].map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="rounded-none border-b-2 border-transparent px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="description" className="max-w-2xl py-8 leading-relaxed text-muted-foreground">
              {product.description}
            </TabsContent>

            <TabsContent value="specifications" className="max-w-2xl py-8">
              <dl className="space-y-3">
                {product.specs.map((s) => (
                  <div key={s.label} className="flex items-baseline gap-2 font-mono text-[13px]">
                    <dt className="shrink-0 text-muted-foreground">{s.label}</dt>
                    <span className="min-w-6 flex-1 border-b border-dotted border-border" />
                    <dd className="shrink-0">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </TabsContent>

            <TabsContent value="reviews" className="py-8">
              <div className="grid gap-10 md:grid-cols-[280px_minmax(0,1fr)]">
                <div>
                  <p className="font-display text-6xl">{product.rating}</p>
                  <Stars rating={product.rating} size={15} />
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">{product.reviewCount} reviews</p>
                  <div className="mt-5 space-y-2">
                    {breakdown.map((b) => (
                      <div key={b.star} className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="w-3">{b.star}</span>
                        <span className="h-1.5 flex-1 bg-border">
                          <span className="block h-full bg-foreground" style={{ width: `${b.pct}%` }} />
                        </span>
                        <span className="w-8 text-right">{b.pct}%</span>
                      </div>
                    ))}
                  </div>
                  <button className="mt-6 h-12 w-full border border-foreground font-mono text-xs uppercase tracking-[0.2em]">
                    Write a review
                  </button>
                </div>
                <ul className="divide-y divide-border">
                  {product.reviews.map((r) => (
                    <li key={r.id} className="py-5">
                      <div className="flex items-center gap-3">
                        <Stars rating={r.rating} />
                        <p className="text-sm font-medium">{r.title}</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        {r.author} · {r.date}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="shipping" className="max-w-2xl space-y-3 py-8 text-muted-foreground">
              <p>Standard delivery is 2–4 business days domestically, 5–9 days internationally.</p>
              <p>Free over $75. Cash on Delivery available on domestic orders up to $600.</p>
              <p>30-day returns, unused and in original packaging. We cover return shipping on faults.</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Section invert>
        <SectionHead eyebrow="Same discipline" title="You might also like" />
        <Rail>
          {related.map((p) => (
            <RailItem key={p.slug}>
              <ProductCard product={p} />
            </RailItem>
          ))}
        </Rail>
      </Section>

      {/* Sticky mobile bar */}
      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            className="fixed bottom-16 left-0 right-0 z-40 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden"
          >
            <span className="font-mono text-sm">{money(product.price)}</span>
            <button
              onClick={add}
              disabled={!product.inStock}
              className="h-12 bg-foreground font-mono text-xs uppercase tracking-[0.22em] text-background disabled:opacity-40"
            >
              Add to cart
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}