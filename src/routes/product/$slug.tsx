import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  Lock,
  ImagePlus,
  Play,
  User,
  X,
  Phone,
  MessageCircle,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Truck,
  Zap,
  Check,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Brackets, Eyebrow, Stars, Tag } from "@/components/site/focus";
import { ProductCard } from "@/components/site/product-card";
import { Rail, RailItem, Section, SectionHead } from "@/components/site/rail";
import { MediaLightbox, type MediaItem } from "@/components/site/media-lightbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PageSkeleton } from "@/components/site/skeletons";
import type { Product, Review } from "@/data/catalog";
import { GIFT_FEE, apiProductToProduct, money, useStore } from "@/lib/store";
import { catalogApi, mediaUrl, reviewApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { consumePrimedProduct } from "@/lib/product-nav-cache";
import { cn } from "@/lib/utils";

const spring = { type: "spring" as const, stiffness: 420, damping: 28, mass: 0.7 };
export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    // Instant paint from the card the user just clicked (avoids waiting on the network).
    const primed = consumePrimedProduct(params.slug);
    if (primed) return { product: primed, fromCache: true as const };

    try {
      const product = apiProductToProduct((await catalogApi.product(params.slug)).product);
      return { product, fromCache: false as const };
    } catch {
      throw notFound();
    }
  },
  // Paint destination immediately — never keep the previous page (home) on screen.
  pendingMs: 0,
  pendingComponent: () => <PageSkeleton rows={6} />,
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Product not found — Aperture" }, { name: "robots", content: "noindex" }],
      };
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
  const data = Route.useLoaderData() as { product: Product; fromCache?: boolean };
  const [product, setProduct] = useState(data.product);
  const { addToCart, setCartOpen, products: liveProducts, settings } = useStore();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const giftFee = settings?.shipping?.giftFee ?? GIFT_FEE;
  const contact = settings?.contact;
  const [color, setColor] = useState(product.colors[0]?.label || "Default");
  const [size, setSize] = useState(product.sizes?.[0]?.label);
  const [qty, setQty] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  const [imgDir, setImgDir] = useState(0);
  const [gift, setGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [showSticky, setShowSticky] = useState(false);
  const [addedPulse, setAddedPulse] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [keepImages, setKeepImages] = useState<string[]>([]);
  const [keepVideos, setKeepVideos] = useState<string[]>([]);
  const [reviewFiles, setReviewFiles] = useState<{ file: File; url: string; isVideo: boolean }[]>(
    [],
  );
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Keep local product in sync when navigating between PDPs.
  useEffect(() => {
    setProduct(data.product);
  }, [data.product]);

  // If we painted from the list cache, refresh full detail (reviews, etc.) quietly.
  useEffect(() => {
    if (!data.fromCache) return;
    let active = true;
    catalogApi
      .product(data.product.slug)
      .then((res) => {
        if (!active) return;
        setProduct(apiProductToProduct(res.product));
      })
      .catch(() => {
        /* keep primed product */
      });
    return () => {
      active = false;
    };
  }, [data.fromCache, data.product.slug]);

  // Flatten every review image/video into one gallery so the lightbox can
  // page through the whole product's media with next/back controls.
  const reviewMedia = useMemo<MediaItem[]>(() => {
    const items: MediaItem[] = [];
    for (const r of product.reviews) {
      (r.images || []).forEach((url) => items.push({ url, type: "image" }));
      (r.videos || []).forEach((url) => items.push({ url, type: "video" }));
    }
    return items;
  }, [product.reviews]);

  const mediaIndexOf = (url: string) => reviewMedia.findIndex((m) => m.url === url);

  useEffect(() => {
    setColor(product.colors[0]?.label || "Default");
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

  useEffect(() => {
    if (!reviewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setReviewOpen(false);
        setEditingReview(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reviewOpen]);

  const discount = product.compareAt
    ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
    : 0;
  const related = liveProducts.filter((p) => p.slug !== product.slug).slice(0, 6);
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    pct: star === 5 ? 68 : star === 4 ? 22 : star === 3 ? 6 : star === 2 ? 3 : 1,
  }));

  const add = () => {
    addToCart({ slug: product.slug, color, size, qty, gift, giftMessage });
    setCartOpen(true);
    setAddedPulse(true);
    window.setTimeout(() => setAddedPulse(false), 1400);
    toast(`${product.name} × ${qty} added to cart`);
  };

  const imageCount = product.images.length;
  const goImage = useCallback(
    (next: number, dir: number) => {
      if (imageCount <= 1) return;
      setImgDir(dir);
      setImgIndex(((next % imageCount) + imageCount) % imageCount);
    },
    [imageCount],
  );
  const prevImage = useCallback(() => goImage(imgIndex - 1, -1), [goImage, imgIndex]);
  const nextImage = useCallback(() => goImage(imgIndex + 1, 1), [goImage, imgIndex]);

  return (
    <div className="relative">
      <div className="mx-auto max-w-[1440px] px-4 pb-28 pt-4 md:px-10 md:pb-16 md:pt-6">
        <nav className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground md:block">
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> /{" "}
          <span className="text-foreground">{product.name}</span>
        </nav>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mb-3 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground md:hidden"
        >
          <ChevronLeft width={14} height={14} /> Back
        </button>

        <div className="mt-2 grid gap-8 md:mt-6 md:grid-cols-2 md:gap-14">
          {/* Gallery */}
          <div ref={galleryRef} className="md:sticky md:top-24 md:self-start">
            <div className="flex gap-3">
              <div className="hidden w-16 shrink-0 flex-col gap-2 md:flex">
                {product.images.map((src, i) => (
                  <motion.button
                    key={src}
                    type="button"
                    whileHover={reduce ? undefined : { scale: 1.04 }}
                    whileTap={reduce ? undefined : { scale: 0.96 }}
                    onClick={() => goImage(i, i > imgIndex ? 1 : -1)}
                    className={cn(
                      "aspect-square overflow-hidden border transition-all duration-300",
                      i === imgIndex
                        ? "border-primary opacity-100 ring-1 ring-primary/50"
                        : "border-border opacity-55 hover:opacity-90",
                    )}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </motion.button>
                ))}
              </div>
              <div
                className="crosshair relative aspect-square w-full touch-pan-y overflow-hidden border border-border bg-secondary select-none premium-glow"
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    prevImage();
                  }
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    nextImage();
                  }
                }}
                tabIndex={0}
                role="region"
                aria-roledescription="image carousel"
                aria-label={`${product.name} images`}
              >
                <AnimatePresence initial={false} custom={imgDir} mode="popLayout">
                  <motion.img
                    key={`${imgIndex}-${color}`}
                    src={product.images[imgIndex]}
                    alt={`${product.name} — image ${imgIndex + 1} of ${imageCount}`}
                    custom={imgDir}
                    drag={imageCount > 1 ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.18}
                    onDragEnd={(_e, info) => {
                      const swipe = info.offset.x;
                      const velocity = info.velocity.x;
                      if (swipe < -64 || velocity < -500) nextImage();
                      else if (swipe > 64 || velocity > 500) prevImage();
                    }}
                    initial={
                      imgDir === 0
                        ? { opacity: 0, scale: 1.03 }
                        : { opacity: 0, x: imgDir > 0 ? 72 : -72, scale: 1.02 }
                    }
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{
                      opacity: 0,
                      x: imgDir > 0 ? -56 : 56,
                      transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                    }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 h-full w-full cursor-grab object-cover active:cursor-grabbing"
                    draggable={false}
                  />
                </AnimatePresence>
                <Brackets size={26} className="pointer-events-none text-primary/70" />

                {discount > 0 && (
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-3 top-3 z-10"
                  >
                    <Tag>−{discount}%</Tag>
                  </motion.div>
                )}

                {imageCount > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center border border-foreground/20 bg-background/80 text-foreground backdrop-blur-sm transition-all duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground md:left-3"
                    >
                      <ChevronLeft width={20} height={20} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next image"
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center border border-foreground/20 bg-background/80 text-foreground backdrop-blur-sm transition-all duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground md:right-3"
                    >
                      <ChevronRight width={20} height={20} strokeWidth={1.5} />
                    </button>
                    <div className="pointer-events-none absolute bottom-3 right-3 z-10 bg-background/75 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground backdrop-blur-sm">
                      {String(imgIndex + 1).padStart(2, "0")} /{" "}
                      {String(imageCount).padStart(2, "0")}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-3 flex justify-center gap-1.5 md:hidden">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`Image ${i + 1}`}
                  onClick={() => goImage(i, i > imgIndex ? 1 : -1)}
                  className={cn(
                    "h-1.5 transition-all duration-300",
                    i === imgIndex ? "w-7 bg-primary" : "w-4 bg-border",
                  )}
                />
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <Eyebrow>
              {product.brand}
              {(product.categories?.length ? product.categories : [product.category])
                .filter(Boolean)
                .map((c) => ` / ${c}`)
                .join("")}
            </Eyebrow>
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 text-[1.75rem] leading-tight md:text-5xl"
            >
              {product.name}
            </motion.h1>
            <a
              href="#reviews"
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/50 px-3 py-1.5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Stars rating={product.rating} size={14} />
              <span className="font-mono text-xs">
                {product.rating.toFixed(1)} · {product.reviewCount} reviews
              </span>
            </a>

            <div className="mt-4 flex flex-wrap items-center gap-3 md:mt-5">
              <motion.span
                key={`${product.price}-${qty}`}
                initial={reduce ? false : { opacity: 0.4, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-text font-mono text-xl md:text-2xl"
              >
                {money(product.price * qty)}
              </motion.span>
              {product.compareAt && (
                <>
                  <span className="font-mono text-sm text-muted-foreground line-through">
                    {money(product.compareAt * qty)}
                  </span>
                  <Tag>Save {discount}%</Tag>
                </>
              )}
              {qty > 1 && (
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {money(product.price)} each
                </span>
              )}
            </div>

            <p className="mt-5 max-w-md text-muted-foreground">{product.short}</p>

            {/* Soft highlight chips — icons only, no childish emoji */}
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { icon: Truck, label: "Fast dispatch", tone: "text-primary" },
                { icon: Zap, label: "COD available", tone: "text-amber-500 dark:text-amber-400" },
                {
                  icon: ShieldCheck,
                  label: "1-yr cover",
                  tone: "text-emerald-600 dark:text-emerald-400",
                },
              ].map(({ icon: Icon, label, tone }) => (
                <motion.span
                  key={label}
                  whileHover={reduce ? undefined : { y: -2 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/80"
                >
                  <Icon width={12} height={12} className={tone} strokeWidth={1.8} />
                  {label}
                </motion.span>
              ))}
            </div>

            {product.stock > 0 && product.stock <= 6 && (
              <motion.p
                animate={reduce ? undefined : { opacity: [1, 0.72, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="premium-badge mt-4 inline-block px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
              >
                Only {product.stock} left
              </motion.p>
            )}

            {/* Variants */}
            <div className="mt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">
                Finish · <span className="text-primary">{color}</span>
              </p>
              <div className="mt-3 flex gap-2">
                {product.colors.map((c) => (
                  <motion.button
                    key={c.id}
                    type="button"
                    whileTap={reduce ? undefined : { scale: 0.94 }}
                    onClick={() => setColor(c.label)}
                    className={cn(
                      "flex h-11 items-center gap-2 border px-3 font-mono text-[11px] transition-all",
                      color === c.label
                        ? "border-primary ring-1 ring-primary"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <span
                      className={cn(
                        "h-4 w-4 border border-border",
                        !c.value && (c.id === "ink" ? "bg-foreground" : "bg-secondary"),
                      )}
                      style={{ backgroundColor: c.value || undefined }}
                      aria-hidden="true"
                    />
                    {c.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {product.sizes && (
              <div className="mt-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">
                  Option
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <motion.button
                      key={s.id}
                      type="button"
                      whileTap={reduce ? undefined : { scale: 0.94 }}
                      onClick={() => setSize(s.label)}
                      className={cn(
                        "h-11 border px-4 font-mono text-[11px] transition-colors",
                        size === s.label
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/60",
                      )}
                    >
                      {s.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty + actions */}
            <div className="mt-8 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
              <div className="premium-pill flex h-14 w-full items-center justify-between md:h-12 md:w-auto md:justify-start">
                <motion.button
                  type="button"
                  aria-label="Decrease"
                  whileTap={reduce ? undefined : { scale: 0.88 }}
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="no-glass grid h-14 w-14 place-items-center md:h-12 md:w-12"
                >
                  <Minus width={16} height={16} />
                </motion.button>
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={qty}
                    initial={reduce ? false : { y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={reduce ? undefined : { y: -8, opacity: 0 }}
                    transition={spring}
                    className="premium-text min-w-10 text-center font-mono text-base md:w-8 md:text-sm"
                  >
                    {qty}
                  </motion.span>
                </AnimatePresence>
                <motion.button
                  type="button"
                  aria-label="Increase"
                  whileTap={reduce ? undefined : { scale: 0.88 }}
                  onClick={() => setQty(qty + 1)}
                  className="no-glass grid h-14 w-14 place-items-center md:h-12 md:w-12"
                >
                  <Plus width={16} height={16} />
                </motion.button>
              </div>
              <motion.button
                type="button"
                onClick={add}
                disabled={!product.inStock}
                whileHover={reduce || !product.inStock ? undefined : { scale: 1.015 }}
                whileTap={reduce || !product.inStock ? undefined : { scale: 0.98 }}
                className="glass-sweep glass-sweep-strong premium-badge relative h-14 w-full overflow-hidden px-8 font-mono text-[13px] uppercase tracking-[0.18em] text-background disabled:opacity-40 md:h-12 md:flex-1 md:text-xs md:tracking-[0.22em]"
              >
                <AnimatePresence mode="wait">
                  {addedPulse ? (
                    <motion.span
                      key="ok"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="inline-flex items-center gap-2"
                    >
                      <Check width={15} height={15} /> Added
                    </motion.span>
                  ) : (
                    <motion.span
                      key="cta"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="inline-flex items-center gap-2"
                    >
                      <Sparkles width={14} height={14} />
                      {product.inStock ? "Add to cart" : "Sold out"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              <Link
                to="/checkout"
                onClick={add}
                className="glass-sweep glass-sweep-ink grid h-14 w-full place-items-center border border-primary/70 px-8 font-mono text-[13px] uppercase tracking-[0.18em] transition-colors hover:bg-primary hover:text-primary-foreground md:h-12 md:flex-1 md:text-xs md:tracking-[0.22em]"
              >
                Buy now
              </Link>
            </div>

            {/* Gift wrap */}
            <div className="mt-6 rounded-xl border border-border/80 bg-secondary/30 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-xs">Add gift wrapping (+{money(giftFee)})</span>
                <Switch checked={gift} onCheckedChange={setGift} />
              </div>
              {gift && (
                <Textarea
                  placeholder="Gift message (shown to the recipient)"
                  className="mt-3 font-mono text-xs"
                  rows={3}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                />
              )}
            </div>

            <p className="mt-6 font-mono text-xs text-muted-foreground">
              Free delivery by Thu 30 Jul · Cash on Delivery available
            </p>

            <div className="mt-6 grid grid-cols-3 overflow-hidden rounded-2xl border border-border/70 md:rounded-xl">
              {[
                { icon: Lock, t: "Secure checkout", tone: "text-primary" },
                { icon: RotateCcw, t: "30-day returns", tone: "text-sky-500 dark:text-sky-400" },
                {
                  icon: ShieldCheck,
                  t: "1-year warranty",
                  tone: "text-emerald-600 dark:text-emerald-400",
                },
              ].map(({ icon: Icon, t, tone }) => (
                <motion.div
                  key={t}
                  whileHover={
                    reduce
                      ? undefined
                      : { backgroundColor: "color-mix(in oklab, var(--primary) 8%, transparent)" }
                  }
                  className="flex flex-col items-center gap-1.5 border-r border-border/70 px-1.5 py-3 text-center last:border-r-0 md:gap-2 md:px-2 md:py-4"
                >
                  <Icon width={16} height={16} strokeWidth={1.4} className={tone} />
                  <span className="font-mono text-[8px] uppercase tracking-[0.12em] md:text-[9px] md:tracking-[0.14em]">
                    {t}
                  </span>
                </motion.div>
              ))}
            </div>

            {product.specs.length > 0 && (
              <div className="mt-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Key specs
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.specs.slice(0, 4).map((s) => (
                    <span
                      key={s.label}
                      className="rounded-lg border border-border/60 bg-background/60 px-2.5 py-1.5 font-mono text-[11px]"
                    >
                      <span className="text-muted-foreground">{s.label}</span>{" "}
                      <span className="text-foreground">{s.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail sections — mobile accordion (reviews open), desktop tabs */}
        <div className="mt-12 md:mt-20" id="reviews">
          {/* Mobile */}
          <Accordion
            type="multiple"
            defaultValue={["reviews"]}
            className="w-full border-t border-border md:hidden"
          >
            <AccordionItem value="reviews" className="border-border">
              <AccordionTrigger className="py-4 font-mono text-[12px] uppercase tracking-[0.16em] hover:no-underline">
                Reviews ({product.reviewCount})
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <ReviewsPanel
                  product={product}
                  breakdown={breakdown}
                  userId={user?.id}
                  onWrite={() => {
                    setEditingReview(null);
                    setReviewRating(5);
                    setReviewBody("");
                    setReviewAuthor("");
                    setReviewFiles([]);
                    setKeepImages([]);
                    setKeepVideos([]);
                    setReviewOpen(true);
                  }}
                  onOpenMedia={(url) => setLightboxIndex(mediaIndexOf(url))}
                  onEdit={(r) => {
                    setEditingReview(r);
                    setReviewRating(r.rating);
                    setReviewBody(r.body);
                    setReviewFiles([]);
                    const toPath = (u: string) => {
                      const i = u.indexOf("/uploads/");
                      return i >= 0 ? u.slice(i) : u;
                    };
                    setKeepImages((r.images || []).map(toPath));
                    setKeepVideos((r.videos || []).map(toPath));
                    setReviewOpen(true);
                  }}
                  onDelete={async (r) => {
                    if (!confirm("Delete your review?")) return;
                    try {
                      await reviewApi.deleteMine(r.id);
                      toast.success("Review deleted");
                      window.location.reload();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Could not delete");
                    }
                  }}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="description" className="border-border">
              <AccordionTrigger className="py-4 font-mono text-[12px] uppercase tracking-[0.16em] hover:no-underline">
                Description
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-[15px] leading-relaxed text-muted-foreground">
                {product.description}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="specifications" className="border-border">
              <AccordionTrigger className="py-4 font-mono text-[12px] uppercase tracking-[0.16em] hover:no-underline">
                Specifications
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <dl className="space-y-3">
                  {product.specs.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-start justify-between gap-4 border-b border-border/70 pb-3 font-mono text-[13px] last:border-0"
                    >
                      <dt className="text-muted-foreground">{s.label}</dt>
                      <dd className="max-w-[55%] text-right">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="shipping" className="border-border">
              <AccordionTrigger className="py-4 font-mono text-[12px] uppercase tracking-[0.16em] hover:no-underline">
                Shipping & returns
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-6 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  Standard delivery is 2–4 business days domestically, 5–9 days internationally.
                </p>
                <p>Free over $75. Cash on Delivery available on domestic orders up to $600.</p>
                <p>
                  30-day returns, unused and in original packaging. We cover return shipping on
                  faults.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Desktop */}
          <Tabs defaultValue="reviews" className="hidden md:block">
            <TabsList className="no-scrollbar h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
              {["description", "specifications", "reviews", "shipping"].map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="rounded-none border-b-2 border-transparent px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent
              value="description"
              className="max-w-2xl py-8 leading-relaxed text-muted-foreground"
            >
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
              <ReviewsPanel
                product={product}
                breakdown={breakdown}
                userId={user?.id}
                onWrite={() => {
                  setEditingReview(null);
                  setReviewRating(5);
                  setReviewBody("");
                  setReviewAuthor("");
                  setReviewFiles([]);
                  setKeepImages([]);
                  setKeepVideos([]);
                  setReviewOpen(true);
                }}
                onOpenMedia={(url) => setLightboxIndex(mediaIndexOf(url))}
                onEdit={(r) => {
                  setEditingReview(r);
                  setReviewRating(r.rating);
                  setReviewBody(r.body);
                  setReviewFiles([]);
                  const toPath = (u: string) => {
                    const i = u.indexOf("/uploads/");
                    return i >= 0 ? u.slice(i) : u;
                  };
                  setKeepImages((r.images || []).map(toPath));
                  setKeepVideos((r.videos || []).map(toPath));
                  setReviewOpen(true);
                }}
                onDelete={async (r) => {
                  if (!confirm("Delete your review?")) return;
                  try {
                    await reviewApi.deleteMine(r.id);
                    toast.success("Review deleted");
                    window.location.reload();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not delete");
                  }
                }}
              />
            </TabsContent>

            <TabsContent
              value="shipping"
              className="max-w-2xl space-y-3 py-8 text-muted-foreground"
            >
              <p>Standard delivery is 2–4 business days domestically, 5–9 days internationally.</p>
              <p>Free over $75. Cash on Delivery available on domestic orders up to $600.</p>
              <p>
                30-day returns, unused and in original packaging. We cover return shipping on
                faults.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <section className="mx-auto max-w-[1440px] px-4 pb-8 md:px-10">
        <div className="border-t border-border pt-8">
          <Eyebrow>Contact & help</Eyebrow>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {settings?.help?.helpText ||
              "Questions about this product? Reach us by call or WhatsApp — we reply within one working day."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`tel:${contact?.phone || ""}`}
              className="flex h-11 items-center gap-2 border border-foreground px-4 font-mono text-xs transition-colors hover:bg-foreground hover:text-background"
            >
              <Phone width={15} /> {settings?.help?.callLabel || "Call"} · {contact?.phone || ""}
            </a>
            <a
              href={`https://wa.me/${(contact?.whatsapp || "").replace(/\D/g, "")}`}
              className="flex h-11 items-center gap-2 bg-foreground px-4 font-mono text-xs text-background"
            >
              <MessageCircle width={15} /> {settings?.help?.whatsappLabel || "WhatsApp"}
            </a>
          </div>
        </div>
      </section>

      <Section invert>
        <SectionHead eyebrow="Same discipline" title="You might also like" />
        <Rail resetKey={related.map((p) => p.slug).join("|") || "related-empty"}>
          {related.map((p) => (
            <RailItem key={p.slug}>
              <ProductCard product={p} />
            </RailItem>
          ))}
        </Rail>
      </Section>

      <MediaLightbox
        items={reviewMedia}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />

      <AnimatePresence>
        {reviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-foreground/60 p-4"
            onClick={() => {
              setReviewOpen(false);
              setEditingReview(null);
            }}
          >
            <motion.form
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={async (e) => {
                e.preventDefault();
                if (!reviewBody.trim()) {
                  toast.error("Please write a comment.");
                  return;
                }
                const form = new FormData();
                form.set("rating", String(reviewRating));
                form.set("body", reviewBody.trim());
                reviewFiles.forEach((m) => form.append(m.isVideo ? "videos" : "images", m.file));
                setReviewSaving(true);
                try {
                  if (editingReview) {
                    form.set("keepImages", JSON.stringify(keepImages));
                    form.set("keepVideos", JSON.stringify(keepVideos));
                    await reviewApi.updateMine(editingReview.id, form);
                    toast.success("Review updated.");
                  } else {
                    form.set("slug", product.slug);
                    if (!user && reviewAuthor.trim()) form.set("author", reviewAuthor.trim());
                    await reviewApi.create(form);
                    toast.success("Review published — thank you.");
                  }
                  setReviewOpen(false);
                  setEditingReview(null);
                  window.location.reload();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not save review");
                } finally {
                  setReviewSaving(false);
                }
              }}
              className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto bg-background p-6"
            >
              {reviewSaving && (
                <div
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-background/85 backdrop-blur-sm"
                  role="status"
                  aria-live="polite"
                >
                  <span className="h-7 w-7 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em]">
                    {reviewFiles.length ? "Uploading media…" : "Saving review…"}
                  </p>
                </div>
              )}
              <button
                type="button"
                aria-label="Close review"
                disabled={reviewSaving}
                onClick={() => {
                  setReviewOpen(false);
                  setEditingReview(null);
                }}
                className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center hover:bg-secondary disabled:opacity-40"
              >
                <X width={18} />
              </button>
              <Eyebrow>Product review</Eyebrow>
              <h2 className="mt-2 text-3xl">
                {editingReview ? "Edit your review" : `Review ${product.name}`}
              </h2>

              {user ? (
                <div className="mt-4 flex items-center gap-3 border border-border p-3">
                  <ReviewAvatar src={mediaUrl(user.avatar)} name={user.name} size={36} />
                  <div>
                    <p className="text-sm font-medium">Posting as {user.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 grid gap-3">
                {!user && !editingReview && (
                  <input
                    value={reviewAuthor}
                    onChange={(e) => setReviewAuthor(e.target.value)}
                    className="h-12 border border-border bg-transparent px-3 font-mono text-sm outline-none focus:border-foreground"
                    placeholder="Your name (optional)"
                  />
                )}
                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Rating
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setReviewRating(n)}
                        aria-label={`${n} stars`}
                        className="text-2xl transition-transform hover:scale-110"
                      >
                        <span className={n <= reviewRating ? "text-foreground" : "text-border"}>
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  required
                  rows={5}
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="Share your experience…"
                />

                {(keepImages.length > 0 || keepVideos.length > 0 || reviewFiles.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {keepImages.map((src) => (
                      <div key={src} className="relative h-20 w-20 border border-border">
                        <img src={mediaUrl(src)} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          aria-label="Remove"
                          onClick={() => setKeepImages((prev) => prev.filter((u) => u !== src))}
                          className="absolute right-0 top-0 grid h-5 w-5 place-items-center bg-foreground text-background"
                        >
                          <X width={11} height={11} />
                        </button>
                      </div>
                    ))}
                    {keepVideos.map((src) => (
                      <div key={src} className="relative h-20 w-20 border border-border">
                        <video src={mediaUrl(src)} className="h-full w-full object-cover" muted />
                        <button
                          type="button"
                          aria-label="Remove"
                          onClick={() => setKeepVideos((prev) => prev.filter((u) => u !== src))}
                          className="absolute right-0 top-0 grid h-5 w-5 place-items-center bg-foreground text-background"
                        >
                          <X width={11} height={11} />
                        </button>
                      </div>
                    ))}
                    {reviewFiles.map((m, i) => (
                      <div key={m.url} className="relative h-20 w-20 border border-border">
                        {m.isVideo ? (
                          <video src={m.url} className="h-full w-full object-cover" muted />
                        ) : (
                          <img src={m.url} alt="" className="h-full w-full object-cover" />
                        )}
                        <button
                          type="button"
                          aria-label="Remove"
                          onClick={() => {
                            URL.revokeObjectURL(m.url);
                            setReviewFiles((prev) => prev.filter((_, idx) => idx !== i));
                          }}
                          className="absolute right-0 top-0 grid h-5 w-5 place-items-center bg-foreground text-background"
                        >
                          <X width={11} height={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="flex min-h-12 cursor-pointer items-center gap-3 border border-border px-3 font-mono text-xs transition-colors hover:border-foreground">
                  <ImagePlus width={17} /> Add photos or videos
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setReviewFiles((prev) => [
                        ...prev,
                        ...files.map((file) => ({
                          file,
                          url: URL.createObjectURL(file),
                          isVideo: file.type.startsWith("video/"),
                        })),
                      ]);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button
                  disabled={reviewSaving}
                  className="glass-sweep h-12 bg-foreground font-mono text-xs uppercase tracking-[0.2em] text-background disabled:opacity-50"
                >
                  {reviewSaving ? "Saving…" : editingReview ? "Save changes" : "Publish review"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky mobile bar */}
      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            className="fixed bottom-16 left-0 right-0 z-40 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden"
          >
            <span className="premium-text font-mono text-base">{money(product.price * qty)}</span>
            <button
              onClick={add}
              disabled={!product.inStock}
              className="glass-sweep glass-sweep-strong premium-badge h-14 font-mono text-[13px] uppercase tracking-[0.18em] text-background disabled:opacity-40"
            >
              Add to cart
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReviewsPanel({
  product,
  breakdown,
  userId,
  onWrite,
  onOpenMedia,
  onEdit,
  onDelete,
}: {
  product: Product;
  breakdown: { star: number; pct: number }[];
  userId?: string | number;
  onWrite: () => void;
  onOpenMedia: (url: string) => void;
  onEdit: (r: Review) => void;
  onDelete: (r: Review) => void | Promise<void>;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-[280px_minmax(0,1fr)] md:gap-10">
      <div className="rounded-2xl border border-border bg-card p-4 md:rounded-none md:border-0 md:bg-transparent md:p-0">
        <div className="flex items-end gap-3 md:block">
          <p className="font-display text-4xl md:text-6xl">{product.rating}</p>
          <div className="pb-1 md:mt-0 md:pb-0">
            <Stars rating={product.rating} size={15} />
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {product.reviewCount} reviews
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-2 md:mt-5">
          {breakdown.map((b) => (
            <div key={b.star} className="flex items-center gap-2 font-mono text-[11px]">
              <span className="w-3">{b.star}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${b.pct}%` }}
                />
              </span>
              <span className="w-8 text-right">{b.pct}%</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onWrite}
          className="premium-badge mt-5 h-14 w-full font-mono text-[13px] uppercase tracking-[0.18em] md:mt-6 md:h-12 md:text-xs md:tracking-[0.2em]"
        >
          Write a review
        </button>
      </div>
      {product.reviews.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground md:py-8">
          No reviews yet — be the first to share your experience.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {product.reviews.map((r) => (
            <ReviewItem
              key={r.id}
              review={r}
              isOwner={Boolean(userId && r.userId && String(r.userId) === String(userId))}
              onOpenMedia={onOpenMedia}
              onEdit={() => onEdit(r)}
              onDelete={() => onDelete(r)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewAvatar({ src, name, size = 40 }: { src?: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const dim = { width: size, height: size };
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        style={dim}
        onError={() => setFailed(true)}
        className="shrink-0 rounded-full border border-border object-cover"
      />
    );
  }
  return (
    <span
      style={dim}
      className="grid shrink-0 place-items-center rounded-full border border-border bg-secondary text-muted-foreground"
    >
      <User width={size * 0.5} height={size * 0.5} strokeWidth={1.6} />
    </span>
  );
}

function ReviewItem({
  review,
  isOwner,
  onOpenMedia,
  onEdit,
  onDelete,
}: {
  review: Review;
  isOwner?: boolean;
  onOpenMedia: (url: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const media: MediaItem[] = [
    ...(review.images || []).map((url) => ({ url, type: "image" as const })),
    ...(review.videos || []).map((url) => ({ url, type: "video" as const })),
  ];
  return (
    <li className="py-4 md:py-6">
      <div className="flex items-start gap-3">
        <ReviewAvatar src={review.authorImage} name={review.author} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-sm font-medium">{review.author}</p>
            <Stars rating={review.rating} size={12} />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.body}</p>

          {media.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {media.map((m) => (
                <button
                  key={m.url}
                  type="button"
                  onClick={() => onOpenMedia(m.url)}
                  className="group premium-pill relative h-20 w-20 overflow-hidden"
                >
                  {m.type === "video" ? (
                    <>
                      <video src={m.url} className="h-full w-full object-cover" muted />
                      <span className="absolute inset-0 grid place-items-center bg-black/30 text-white transition-colors group-hover:bg-black/50">
                        <Play width={18} height={18} fill="currentColor" />
                      </span>
                    </>
                  ) : (
                    <img
                      src={m.url}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {review.date}
            </p>
            {isOwner && (
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={onEdit}
                  aria-label="Edit review"
                  title="Edit"
                  className="grid h-9 w-9 place-items-center text-primary transition-colors hover:bg-primary/10"
                >
                  <Pencil width={15} height={15} />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  aria-label="Delete review"
                  title="Delete"
                  className="grid h-9 w-9 place-items-center text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 width={15} height={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
