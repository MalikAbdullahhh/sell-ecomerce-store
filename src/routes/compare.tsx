import { createFileRoute, Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Eyebrow, Stars } from "@/components/site/focus";
import { ComparePageSkeleton } from "@/components/site/skeletons";
import { money, useStore } from "@/lib/store";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Products — Aperture" },
      {
        name: "description",
        content:
          "Put two or three Aperture products side by side and compare their published specifications.",
      },
      { property: "og:title", content: "Compare Products — Aperture" },
      { property: "og:description", content: "Compare Aperture products spec for spec." },
    ],
  }),
  component: Compare,
});

function Compare() {
  const { compare, toggleCompare, products, catalogLoading } = useStore();
  const selected = products.filter((p) => compare.includes(p.slug));
  const rows = Array.from(new Set(selected.flatMap((p) => p.specs.map((s) => s.label))));

  if (catalogLoading) return <ComparePageSkeleton />;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-10 md:py-16">
      <Eyebrow>{selected.length} of 3 slots used</Eyebrow>
      <h1 className="mt-2 text-4xl md:text-5xl">Compare</h1>

      <div className="mt-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">Add products</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {products.map((p) => (
            <button
              key={p.slug}
              onClick={() => toggleCompare(p.slug)}
              className={`min-h-11 border px-3 font-mono text-[11px] ${
                compare.includes(p.slug)
                  ? "border-foreground bg-foreground text-background"
                  : "border-border"
              }`}
            >
              {p.name}
            </button>
          ))}
          {products.length === 0 && (
            <p className="font-mono text-[11px] text-muted-foreground">No products loaded yet</p>
          )}
        </div>
      </div>

      {selected.length === 0 ? (
        <p className="mt-12 border border-border p-10 text-center text-lg">
          Pick two or three products above to build a comparison table.
        </p>
      ) : (
        <div className="no-scrollbar mt-10 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse font-mono text-[13px]">
            <thead>
              <tr>
                <th className="sticky left-0 w-40 bg-background text-left align-bottom" />
                {selected.map((p) => (
                  <th key={p.slug} className="p-3 text-left align-bottom">
                    <div className="relative">
                      <img
                        src={p.images[0]}
                        alt=""
                        className="aspect-square w-full border border-border object-cover"
                      />
                      <button
                        onClick={() => toggleCompare(p.slug)}
                        aria-label={`Remove ${p.name}`}
                        className="absolute right-1 top-1 grid h-9 w-9 place-items-center bg-background"
                      >
                        <X width={13} height={13} />
                      </button>
                    </div>
                    <Link
                      to="/product/$slug"
                      params={{ slug: p.slug }}
                      className="mt-3 block font-sans text-base font-medium"
                    >
                      {p.name}
                    </Link>
                    <p className="mt-1">{money(p.price)}</p>
                    <span className="mt-1 flex items-center gap-1">
                      <Stars rating={p.rating} /> {p.rating}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((label) => (
                <tr key={label} className="border-t border-dotted border-border">
                  <th className="sticky left-0 bg-background py-3 pr-4 text-left font-normal text-muted-foreground">
                    {label}
                  </th>
                  {selected.map((p) => (
                    <td key={p.slug} className="p-3">
                      {p.specs.find((s) => s.label === label)?.value ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
