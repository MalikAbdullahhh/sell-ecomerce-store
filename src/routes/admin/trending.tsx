import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { adminBtn, adminBtnGhost, adminField } from "@/components/admin/field";
import { AdminTableSkeleton } from "@/components/site/skeletons";
import { adminApi, mediaUrl, type ProductDoc } from "@/lib/api";
import { notifySiteSettingsUpdated } from "@/lib/brand";

export const Route = createFileRoute("/admin/trending")({
  component: AdminTrending,
  head: () => ({ meta: [{ title: "Trending — Aperture Admin" }] }),
});

function AdminTrending() {
  const qc = useQueryClient();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [pick, setPick] = useState("");
  const [dirty, setDirty] = useState(false);

  const productsQ = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => adminApi.products(),
  });
  const settingsQ = useQuery({
    queryKey: ["admin", "site"],
    queryFn: () => adminApi.site(),
  });

  const products = productsQ.data?.products || [];
  const bySlug = useMemo(() => {
    const map = new Map<string, ProductDoc>();
    for (const p of products) map.set(p.slug, p);
    return map;
  }, [products]);

  useEffect(() => {
    if (!settingsQ.data?.settings || dirty) return;
    setSlugs([...(settingsQ.data.settings.trendingProductSlugs || [])]);
  }, [settingsQ.data, dirty]);

  const save = useMutation({
    mutationFn: () => adminApi.saveSite({ trendingProductSlugs: slugs }),
    onSuccess: () => {
      toast.success("Trending products saved");
      setDirty(false);
      notifySiteSettingsUpdated();
      void qc.invalidateQueries({ queryKey: ["admin", "site"] });
      void qc.invalidateQueries({ queryKey: ["cms", "site"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const available = products
    .filter((p) => p.isActive !== false && !slugs.includes(p.slug))
    .sort((a, b) => a.name.localeCompare(b.name));

  function addSelected() {
    if (!pick) return;
    if (slugs.includes(pick)) return;
    setSlugs((s) => [...s, pick]);
    setPick("");
    setDirty(true);
  }

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= slugs.length) return;
    setSlugs((list) => {
      const copy = [...list];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
    setDirty(true);
  }

  function remove(index: number) {
    setSlugs((list) => list.filter((_, i) => i !== index));
    setDirty(true);
  }

  if (productsQ.isLoading || settingsQ.isLoading) {
    return <AdminTableSkeleton rows={6} />;
  }

  if (productsQ.isError || settingsQ.isError) {
    return (
      <div className="space-y-3 p-6">
        <p className="text-sm text-muted-foreground">Could not load products or settings.</p>
        <button
          type="button"
          className={adminBtn}
          onClick={() => {
            void productsQ.refetch();
            void settingsQ.refetch();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trending</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Choose which products appear in the homepage Trending rail, and set their order. Only
            selected products show there — nothing is auto-picked from ratings or Hot flags.
          </p>
        </div>
        <button
          type="button"
          className={adminBtn}
          disabled={!dirty || save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Saving…" : "Save order"}
        </button>
      </div>

      <section className="space-y-3 border border-border p-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">Add product</h2>
        <div className="flex flex-wrap gap-2">
          <select
            className={adminField}
            value={pick}
            onChange={(e) => setPick(e.target.value)}
          >
            <option value="">Select a product…</option>
            {available.map((p) => (
              <option key={p._id} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="button" className={adminBtn} disabled={!pick} onClick={addSelected}>
            <Plus width={14} height={14} />
            Add
          </button>
        </div>
        {available.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            All active products are already in the trending list, or the catalog is empty.
          </p>
        ) : null}
      </section>

      <section className="space-y-3 border border-border p-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">
          Trending order ({slugs.length})
        </h2>
        {slugs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No products selected yet. Add products above — the homepage Trending section will stay
            empty until you do.
          </p>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {slugs.map((slug, i) => {
              const p = bySlug.get(slug);
              const thumb = p?.images?.[0] ? mediaUrl(p.images[0]) : "";
              return (
                <li key={slug} className="flex items-center gap-3 p-3">
                  <span className="w-6 shrink-0 font-mono text-[11px] text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="h-12 w-12 shrink-0 overflow-hidden border border-border bg-secondary">
                    {thumb ? (
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p?.name || slug}</p>
                    <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {slug}
                      {!p ? " · missing from catalog" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      className={adminBtnGhost}
                      aria-label="Move up"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    >
                      <ArrowUp width={14} height={14} />
                    </button>
                    <button
                      type="button"
                      className={adminBtnGhost}
                      aria-label="Move down"
                      disabled={i === slugs.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ArrowDown width={14} height={14} />
                    </button>
                    <button
                      type="button"
                      className={adminBtnGhost}
                      aria-label="Remove"
                      onClick={() => remove(i)}
                    >
                      <Trash2 width={14} height={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
