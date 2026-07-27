import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eyebrow } from "@/components/site/focus";
import { ProductCard } from "@/components/site/product-card";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({
    meta: [
      { title: "Search Results — Aperture" },
      {
        name: "description",
        content: "Search the Aperture catalogue of audio, wearables, smart home and desk hardware.",
      },
      { property: "og:title", content: "Search Results — Aperture" },
      { property: "og:description", content: "Search the full Aperture catalogue." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const { products } = useStore();
  const [sort, setSort] = useState("relevance");

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.brand.toLowerCase().includes(term) ||
            (p.categories?.length ? p.categories : [p.category]).some((c) =>
              c.toLowerCase().includes(term),
            ) ||
            p.short.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term),
        )
      : products;
    if (sort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") return [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [q, sort, products]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-10 md:py-16">
      <Eyebrow>{results.length} results</Eyebrow>
      <h1 className="mt-2 text-4xl md:text-5xl">{q ? `“${q}”` : "Everything"}</h1>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border pb-4">
        <p className="min-w-0 truncate font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Sorted by
        </p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-11 border border-border bg-transparent px-3 font-mono text-[11px]"
        >
          <option value="relevance">Relevance</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating">Highest rated</option>
        </select>
      </div>

      {results.length === 0 ? (
        <p className="mt-16 border border-border p-10 text-center text-lg">
          Nothing matches that query — try a category like audio, desk or wearables.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
