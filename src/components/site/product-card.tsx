import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Heart, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "@/data/catalog";
import { money, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Brackets, Stars, Tag } from "./focus";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const reduce = useReducedMotion();
  const { toggleWishlist, wishlist, addToCart, setCartOpen } = useStore();
  const [hover, setHover] = useState(false);
  const saved = wishlist.includes(product.slug);
  const discount = product.compareAt
    ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
    : 0;

  return (
    <motion.article
      initial={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(10px)", scale: 1.03 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, filter: "blur(0px)", scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: reduce ? 0.2 : 0.7, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      className={cn("group relative flex flex-col", className)}
    >
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="crosshair relative block aspect-square overflow-hidden border border-border bg-secondary"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-all duration-700",
            hover ? "scale-105 opacity-0" : "opacity-100",
          )}
        />
        <img
          src={product.images[1] ?? product.images[0]}
          alt=""
          aria-hidden
          loading="lazy"
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-all duration-700",
            hover ? "scale-100 opacity-100 blur-0" : "scale-105 opacity-0 blur-sm",
          )}
        />
        <Brackets size={16} className="text-foreground" />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {discount > 0 && <Tag>-{discount}%</Tag>}
          {product.flags.includes("hot") && <Tag>Hot</Tag>}
          {product.flags.includes("new") && <Tag>New</Tag>}
          {!product.inStock && (
            <Tag className="bg-background text-foreground ring-1 ring-foreground">Sold out</Tag>
          )}
        </div>
      </Link>

      <button
        type="button"
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        onClick={() => toggleWishlist(product.slug)}
        className="absolute right-1 top-1 grid h-11 w-11 place-items-center text-foreground"
      >
        <Heart width={17} height={17} strokeWidth={1.5} className={saved ? "fill-current" : ""} />
      </button>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="min-w-0">
          <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
            <h3 className="truncate text-[15px] font-medium tracking-tight">{product.name}</h3>
          </Link>
          <p className="mt-1 flex items-center gap-2 font-mono text-[13px]">
            {money(product.price)}
            {product.compareAt && (
              <span className="text-muted-foreground line-through">{money(product.compareAt)}</span>
            )}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
            <Stars rating={product.rating} />
            <span className="font-mono text-[11px]">({product.reviewCount})</span>
          </p>
        </div>
        <button
          type="button"
          aria-label={`Add ${product.name} to cart`}
          disabled={!product.inStock}
          onClick={() => {
            addToCart({ slug: product.slug });
            setCartOpen(true);
            toast(`${product.name} added to cart`);
          }}
          className="grid h-11 w-11 shrink-0 place-items-center border border-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-30 md:opacity-0 md:group-hover:opacity-100"
        >
          <Plus width={16} height={16} />
        </button>
      </div>
    </motion.article>
  );
}
