import { X } from "lucide-react";
import { brands, categories } from "@/data/catalog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export type FilterState = {
  category: string | null;
  price: [number, number];
  brand: string | null;
  rating: number;
  color: string | null;
  inStock: boolean;
};

export const emptyFilters: FilterState = {
  category: null,
  price: [0, 500],
  brand: null,
  rating: 0,
  color: null,
  inStock: false,
};

const COLORS = ["Graphite", "Chalk"];

export function FilterPanel({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (v: FilterState) => void;
}) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });
  const head = "font-mono text-[10px] uppercase tracking-[0.22em] opacity-60";
  const chip = (active: boolean) =>
    `min-h-11 border px-3 py-2 font-mono text-[11px] transition-colors ${
      active ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"
    }`;

  return (
    <div className="space-y-8">
      <div>
        <p className={head}>Category</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => set({ category: value.category === c.slug ? null : c.slug })}
              className={chip(value.category === c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={head}>Price</p>
        <Slider
          className="mt-5"
          min={0}
          max={500}
          step={10}
          value={value.price}
          onValueChange={(v) => set({ price: [v[0], v[1]] as [number, number] })}
        />
        <p className="mt-3 font-mono text-[11px]">
          ${value.price[0]} — ${value.price[1]}
        </p>
      </div>

      <div>
        <p className={head}>Brand</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {brands.map((b) => (
            <button key={b} onClick={() => set({ brand: value.brand === b ? null : b })} className={chip(value.brand === b)}>
              {b}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={head}>Minimum rating</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[4.5, 4, 3].map((r) => (
            <button key={r} onClick={() => set({ rating: value.rating === r ? 0 : r })} className={chip(value.rating === r)}>
              {r}+
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={head}>Finish</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => set({ color: value.color === c ? null : c })}
              className={chip(value.color === c)}
            >
              {c}
            </button>
          ))}
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
  const chips: { label: string; clear: Partial<FilterState> }[] = [];
  if (value.category)
    chips.push({
      label: categories.find((c) => c.slug === value.category)?.name ?? value.category,
      clear: { category: null },
    });
  if (value.brand) chips.push({ label: value.brand, clear: { brand: null } });
  if (value.rating) chips.push({ label: `${value.rating}+ stars`, clear: { rating: 0 } });
  if (value.color) chips.push({ label: value.color, clear: { color: null } });
  if (value.inStock) chips.push({ label: "In stock", clear: { inStock: false } });
  if (value.price[0] !== 0 || value.price[1] !== 500)
    chips.push({ label: `$${value.price[0]}–$${value.price[1]}`, clear: { price: [0, 500] } });

  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <button
          key={c.label}
          onClick={() => onChange({ ...value, ...c.clear })}
          className="flex min-h-9 items-center gap-2 border border-border px-3 font-mono text-[11px]"
        >
          {c.label}
          <X width={12} height={12} />
        </button>
      ))}
    </div>
  );
}