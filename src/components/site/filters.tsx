import { X } from "lucide-react";
import { useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { Product } from "@/data/catalog";
import { useStore } from "@/lib/store";

export type FilterState = {
  category: string | null;
  price: [number, number];
  brand: string | null;
  rating: number;
  color: string | null;
  inStock: boolean;
};

export const PRICE_MAX = 150000;
/** Default upper bound — high enough that no live product is filtered out until the user narrows the range. */
export const PRICE_CEILING = 9_999_999;

export const emptyFilters: FilterState = {
  category: null,
  price: [0, PRICE_CEILING],
  brand: null,
  rating: 0,
  color: null,
  inStock: false,
};

/** Match a product against a category slug, including multi-category products. */
export function productInCategory(product: Product, slug: string) {
  const needle = String(slug || "").trim();
  if (!needle) return true;
  const list = (product.categories?.length ? product.categories : [product.category])
    .map((c) => String(c || "").trim())
    .filter(Boolean);
  return list.includes(needle);
}

export function productCategorySlugs(product: Product): string[] {
  const list = product.categories?.length ? product.categories : [product.category];
  return Array.from(new Set(list.map((c) => String(c || "").trim()).filter(Boolean)));
}

export function FilterPanel({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (v: FilterState) => void;
}) {
  const { products, categories } = useStore();
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });
  const head = "font-mono text-[10px] uppercase tracking-[0.22em] opacity-60";
  const chip = (active: boolean) =>
    `min-h-11 border px-3 py-2 font-mono text-[11px] transition-colors ${
      active
        ? "border-foreground bg-foreground text-background"
        : "border-border hover:border-foreground"
    }`;

  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort(),
    [products],
  );
  const colors = useMemo(
    () =>
      Array.from(
        new Set(products.flatMap((p) => p.colors.map((c) => c.label)).filter(Boolean)),
      ).sort(),
    [products],
  );
  const cats = useMemo(() => {
    if (categories.length) {
      return categories
        .filter((c) => c.isActive !== false)
        .map((c) => ({ slug: c.slug, name: c.name }));
    }
    return Array.from(new Set(products.flatMap((p) => productCategorySlugs(p)))).map((slug) => ({
      slug,
      name: slug,
    }));
  }, [categories, products]);

  const maxPrice = useMemo(() => {
    const top = Math.max(PRICE_MAX, ...products.map((p) => p.price), 0);
    return Math.ceil(top / 5000) * 5000 || PRICE_MAX;
  }, [products]);

  const sliderMin = Math.max(0, Math.min(value.price[0], maxPrice));
  const sliderMax = Math.max(
    sliderMin,
    Math.min(value.price[1] >= PRICE_CEILING ? maxPrice : value.price[1], maxPrice),
  );

  return (
    <div className="space-y-8">
      <div>
        <p className={head}>Category</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => set({ category: value.category === c.slug ? null : c.slug })}
              className={chip(value.category === c.slug)}
            >
              {c.name}
            </button>
          ))}
          {cats.length === 0 && (
            <p className="font-mono text-[11px] text-muted-foreground">No categories yet</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-end justify-between gap-3">
          <p className={head}>Price</p>
          <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
            Rs {sliderMin.toLocaleString("en-PK")} — Rs {sliderMax.toLocaleString("en-PK")}
            {value.price[1] >= PRICE_CEILING ? "+" : ""}
          </p>
        </div>
        <Slider
          className="mt-4"
          min={0}
          max={maxPrice}
          step={1000}
          value={[sliderMin, sliderMax]}
          onValueChange={(v) => {
            const lo = Math.max(0, v[0] ?? 0);
            const hi = Math.max(lo, v[1] ?? maxPrice);
            // Treat full-range as "no price filter" so new higher-priced items still show.
            const unbounded = lo === 0 && hi >= maxPrice;
            set({ price: [lo, unbounded ? PRICE_CEILING : hi] });
          }}
        />
        <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <span>Min</span>
          <span>Max</span>
        </div>
      </div>

      <div>
        <p className={head}>Brand</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {brands.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => set({ brand: value.brand === b ? null : b })}
              className={chip(value.brand === b)}
            >
              {b}
            </button>
          ))}
          {brands.length === 0 && (
            <p className="font-mono text-[11px] text-muted-foreground">No brands yet</p>
          )}
        </div>
      </div>

      <div>
        <p className={head}>Minimum rating</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[4.5, 4, 3].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => set({ rating: value.rating === r ? 0 : r })}
              className={chip(value.rating === r)}
            >
              {r}+
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={head}>Finish</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set({ color: value.color === c ? null : c })}
              className={chip(value.color === c)}
            >
              {c}
            </button>
          ))}
          {colors.length === 0 && (
            <p className="font-mono text-[11px] text-muted-foreground">No finishes yet</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-5">
        <p className={head}>In stock only</p>
        <Switch checked={value.inStock} onCheckedChange={(v) => set({ inStock: v })} />
      </div>
    </div>
  );
}

export function FilterChips({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (v: FilterState) => void;
}) {
  const { categories, products } = useStore();
  const maxPrice = useMemo(() => {
    const top = Math.max(PRICE_MAX, ...products.map((p) => p.price), 0);
    return Math.ceil(top / 5000) * 5000 || PRICE_MAX;
  }, [products]);
  const chips: { label: string; clear: Partial<FilterState> }[] = [];
  if (value.category) {
    chips.push({
      label: categories.find((c) => c.slug === value.category)?.name ?? value.category,
      clear: { category: null },
    });
  }
  if (value.brand) chips.push({ label: value.brand, clear: { brand: null } });
  if (value.rating) chips.push({ label: `${value.rating}+ stars`, clear: { rating: 0 } });
  if (value.color) chips.push({ label: value.color, clear: { color: null } });
  if (value.inStock) chips.push({ label: "In stock", clear: { inStock: false } });
  if (value.price[0] !== 0 || value.price[1] < PRICE_CEILING) {
    chips.push({
      label: `Rs ${value.price[0].toLocaleString("en-PK")}–${Math.min(value.price[1], maxPrice).toLocaleString("en-PK")}`,
      clear: { price: [0, PRICE_CEILING] },
    });
  }

  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <button
          key={c.label}
          type="button"
          onClick={() => onChange({ ...value, ...c.clear })}
          className="flex min-h-9 items-center gap-2 border border-border px-3 font-mono text-[11px]"
        >
          {c.label}
          <X width={12} height={12} />
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(emptyFilters)}
        className="min-h-9 border-b border-foreground px-1 font-mono text-[11px] uppercase tracking-[0.14em]"
      >
        Clear all
      </button>
    </div>
  );
}
