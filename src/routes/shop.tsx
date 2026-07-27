import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Eyebrow } from "@/components/site/focus";
import {
  emptyFilters,
  FilterChips,
  FilterPanel,
  productInCategory,
  type FilterState,
} from "@/components/site/filters";
import { ProductCard } from "@/components/site/product-card";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { categories as fallbackCategories } from "@/data/catalog";
import { usePageContent } from "@/lib/page-content";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): { category?: string } => {
    const category = typeof search.category === "string" ? search.category : undefined;
    return category ? { category } : {};
  },
  head: () => ({
    meta: [
      { title: "Shop All Products — Aperture" },
      {
        name: "description",
        content:
          "Browse Aperture audio, wearables, smart home, optics and desk hardware. Filter by price, brand, rating and finish.",
      },
      { property: "og:title", content: "Shop All Products — Aperture" },
      {
        property: "og:description",
        content: "Filter the full Aperture catalogue by price, brand, rating and finish.",
      },
    ],
  }),
  component: Shop,
});

const SORTS = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  rating: "Highest rated",
} as const;

function Shop() {
  const navigate = useNavigate({ from: "/shop" });
  const { products, categories: apiCategories } = useStore();
  const { section } = usePageContent("shop");
  const { category } = Route.useSearch();
  const [filters, setFilters] = useState<FilterState>({
    ...emptyFilters,
    category: category ?? null,
  });
  const [sort, setSort] = useState<keyof typeof SORTS>("featured");
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Keep filters in sync when landing from category links / browser back-forward.
  useEffect(() => {
    setFilters((f) =>
      f.category === (category ?? null) ? f : { ...f, category: category ?? null },
    );
  }, [category]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 320);
    return () => clearTimeout(t);
  }, [filters, sort, products]);

  const applyFilters = (next: FilterState) => {
    setFilters(next);
    const nextCat = next.category || undefined;
    const curCat = category || undefined;
    if (nextCat !== curCat) {
      void navigate({
        search: nextCat ? { category: nextCat } : {},
        replace: true,
      });
    }
  };

  const results = useMemo(() => {
    const list = products.filter((p) => {
      if (filters.category && !productInCategory(p, filters.category)) return false;
      const min = Number(filters.price[0]) || 0;
      const max = Number(filters.price[1]);
      if (Number.isFinite(min) && p.price < min) return false;
      if (Number.isFinite(max) && p.price > max) return false;
      if (filters.brand && p.brand !== filters.brand) return false;
      if (filters.rating && p.rating < filters.rating) return false;
      if (filters.color && !p.colors.some((c) => c.label === filters.color)) return false;
      if (filters.inStock && !p.inStock) return false;
      return true;
    });
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [filters, sort, products]);

  const catName = filters.category
    ? (apiCategories.find((c) => c.slug === filters.category)?.name ??
      fallbackCategories.find((c) => c.slug === filters.category)?.name ??
      filters.category)
    : "All";

  const header = section<{ title: string; countSuffix: string; emptyText: string }>("header");

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-10 md:py-12">
      <nav className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> /{" "}
        <span className="text-foreground">{catName}</span>
      </nav>

      <header className="mt-4">
        <Eyebrow>
          {results.length} {header.countSuffix}
        </Eyebrow>
        <h1 className="mt-2 text-4xl md:text-5xl">{catName === "All" ? header.title : catName}</h1>
      </header>

      <div className="mt-10 grid gap-10 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden md:block">
          <FilterPanel value={filters} onChange={applyFilters} />
        </aside>

        <div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border pb-4">
            <p className="min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {results.length} results
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as keyof typeof SORTS)}
              className="h-11 shrink-0 border border-border bg-transparent px-3 font-mono text-[11px]"
            >
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <FilterChips value={filters} onChange={applyFilters} />
          </div>

          {loading ? (
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="mt-3 h-4 w-2/3" />
                  <Skeleton className="mt-2 h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="mt-16 border border-border p-10 text-center">
              <p className="text-lg">{header.emptyText}</p>
              <button
                onClick={() => applyFilters(emptyFilters)}
                className="glass-sweep mt-5 h-12 bg-foreground px-6 font-mono text-xs uppercase tracking-[0.22em] text-background"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
              {results.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
        <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
          <DrawerTrigger className="flex h-12 w-full items-center justify-center gap-2 bg-foreground font-mono text-xs uppercase tracking-[0.22em] text-background">
            <SlidersHorizontal width={15} height={15} /> Filters
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <div className="no-scrollbar overflow-y-auto px-4 pb-28 pt-4">
              <FilterPanel value={filters} onChange={applyFilters} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-background p-3">
              <button
                onClick={() => setSheetOpen(false)}
                className="h-12 w-full bg-foreground font-mono text-xs uppercase tracking-[0.22em] text-background"
              >
                Show {results.length} results
              </button>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
