import { createFileRoute, Link } from "@tanstack/react-router";
import { Eyebrow } from "@/components/site/focus";
import { ProductCard } from "@/components/site/product-card";
import { products } from "@/data/catalog";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — Aperture" },
      { name: "description", content: "Products you have saved for later at Aperture." },
      { property: "og:title", content: "Wishlist — Aperture" },
      { property: "og:description", content: "Products you have saved for later." },
    ],
  }),
  component: Wishlist,
});

function Wishlist() {
  const { wishlist, addToCart, setCartOpen } = useStore();
  const saved = products.filter((p) => wishlist.includes(p.slug));

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-10 md:py-16">
      <Eyebrow>{saved.length} saved</Eyebrow>
      <h1 className="mt-2 text-4xl md:text-5xl">Wishlist</h1>

      {saved.length === 0 ? (
        <div className="mt-12 border border-border p-10 text-center">
          <p className="text-lg">Nothing saved yet. Tap the heart on any product to keep it here.</p>
          <Link
            to="/shop"
            className="mt-5 inline-grid h-12 place-items-center bg-foreground px-8 font-mono text-xs uppercase tracking-[0.22em] text-background"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {saved.map((p) => (
            <div key={p.slug}>
              <ProductCard product={p} />
              <button
                onClick={() => {
                  addToCart({ slug: p.slug });
                  setCartOpen(true);
                }}
                className="mt-3 h-11 w-full border border-foreground font-mono text-[11px] uppercase tracking-[0.18em]"
              >
                Move to cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}