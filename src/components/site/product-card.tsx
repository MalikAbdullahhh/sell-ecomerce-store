import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Heart, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "@/data/catalog";
import { money, useStore } from "@/lib/store";
import { primeProductNav } from "@/lib/product-nav-cache";
import { cn } from "@/lib/utils";
import { Brackets, Stars, Tag } from "./focus";

const spring = { type: "spring" as const, stiffness: 420, damping: 28, mass: 0.7 };
const soft = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const reduce = useReducedMotion();
  const { toggleWishlist, wishlist, addToCart, setCartOpen } = useStore();
  const [hover, setHover] = useState(false);
  const [pulseHeart, setPulseHeart] = useState(0);
  const [pulseCart, setPulseCart] = useState(0);
  const saved = wishlist.includes(product.slug);
  const discount = product.compareAt
    ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
    : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: reduce ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: reduce ? 0.2 : 0.55, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      className={cn("group relative flex flex-col", className)}
    >
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        preload={false}
        onClick={() => primeProductNav(product)}
        onPointerDown={() => primeProductNav(product)}
        className="product-card-glass premium-surface premium-glow crosshair relative block aspect-square overflow-hidden border border-border"
      >
        <motion.img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          decoding="async"
          animate={
            reduce ? undefined : hover ? { scale: 1.06, opacity: product.images[1] ? 0 : 1 } : { scale: 1, opacity: 1 }
          }
          transition={soft}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {product.images[1] && hover ? (
          <motion.img
            src={product.images[1]}
            alt=""
            aria-hidden
            loading="eager"
            decoding="async"
            initial={reduce ? false : { opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={soft}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
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

      <motion.button
        type="button"
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        onClick={() => {
          toggleWishlist(product.slug);
          setPulseHeart((n) => n + 1);
        }}
        whileHover={reduce ? undefined : { scale: 1.08, rotate: -6 }}
        whileTap={reduce ? undefined : { scale: 0.88 }}
        transition={spring}
        className="glass-sweep absolute right-1 top-1 z-10 grid h-11 w-11 place-items-center text-foreground"
      >
        <motion.span
          key={pulseHeart}
          initial={reduce || pulseHeart === 0 ? false : { scale: 0.55, rotate: -18 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={spring}
          className="grid place-items-center"
        >
          <Heart
            width={17}
            height={17}
            strokeWidth={1.5}
            className={cn(
              "transition-[fill,color] duration-300",
              saved ? "fill-current text-foreground" : "text-foreground",
            )}
          />
        </motion.span>
      </motion.button>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="min-w-0">
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            preload="intent"
            onClick={() => primeProductNav(product)}
            onPointerDown={() => primeProductNav(product)}
            className="block"
          >
            <h3 className="truncate text-[15px] font-medium tracking-tight transition-opacity duration-300 group-hover:opacity-80">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1 flex items-center gap-2 font-mono text-[13px]">
            <span className="premium-text">{money(product.price)}</span>
            {product.compareAt && (
              <span className="text-muted-foreground line-through">{money(product.compareAt)}</span>
            )}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
            <Stars rating={product.rating} />
            <span className="font-mono text-[11px]">({product.reviewCount})</span>
          </p>
        </div>
        <motion.button
          type="button"
          aria-label={`Add ${product.name} to cart`}
          disabled={!product.inStock}
          onClick={() => {
            addToCart({ slug: product.slug });
            setCartOpen(true);
            setPulseCart((n) => n + 1);
            toast(`${product.name} added to cart`);
          }}
          initial={false}
          whileHover={reduce || !product.inStock ? undefined : { scale: 1.07 }}
          whileTap={reduce || !product.inStock ? undefined : { scale: 0.9, rotate: 10 }}
          transition={spring}
          className={cn(
            "glass-sweep grid h-11 w-11 shrink-0 place-items-center border border-foreground text-foreground",
            "transition-colors duration-300 hover:bg-foreground hover:text-background disabled:opacity-30",
            "opacity-100 md:opacity-0 md:duration-300 md:ease-out md:group-hover:opacity-100",
          )}
        >
          <motion.span
            key={pulseCart}
            initial={reduce || pulseCart === 0 ? false : { scale: 0.4, rotate: -40, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={spring}
            className="grid place-items-center"
          >
            <Plus width={16} height={16} />
          </motion.span>
        </motion.button>
      </div>
    </motion.article>
  );
}
