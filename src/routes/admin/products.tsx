import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  adminBtn,
  adminBtnGhost,
  adminBtnOutline,
  adminField,
  adminTextarea,
  Field,
  pkr,
  slugify,
} from "@/components/admin/field";
import { Uploader } from "@/components/admin/uploader";
import { adminApi, mediaUrl, type ProductDoc, type VariantDoc } from "@/lib/api";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
  head: () => ({ meta: [{ title: "Products — Aperture Admin" }] }),
});

type FormState = {
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: string;
  compareAt: string;
  saleDiscountPercent: string;
  short: string;
  description: string;
  images: string[];
  videos: string[];
  specs: { label: string; value: string }[];
  colors: VariantDoc[];
  sizes: VariantDoc[];
  stock: string;
  soldCount: string;
  rating: string;
  reviewCount: string;
  ratingLocked: boolean;
  inStock: boolean;
  isActive: boolean;
  flags: ("new" | "hot" | "sale")[];
};

const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  brand: "Aperture",
  category: "",
  price: "",
  compareAt: "",
  saleDiscountPercent: "",
  short: "",
  description: "",
  images: [],
  videos: [],
  specs: [{ label: "", value: "" }],
  colors: [],
  sizes: [],
  stock: "0",
  soldCount: "0",
  rating: "0",
  reviewCount: "0",
  ratingLocked: false,
  inStock: true,
  isActive: true,
  flags: [],
});

function categoryValue(p: ProductDoc) {
  // Admin list returns the slug via mapProduct; keep that as the select value.
  if (typeof p.categorySlug === "string" && p.categorySlug) return p.categorySlug;
  if (typeof p.category === "string") return p.category;
  if (p.category && typeof p.category === "object") {
    const cat = p.category as { slug?: string; name?: string };
    return cat.slug || cat.name || "";
  }
  return "";
}

function fromProduct(p: ProductDoc): FormState {
  const stock = Number(p.stock ?? 0);
  return {
    name: p.name || "",
    slug: p.slug || "",
    brand: p.brand || "Aperture",
    category: categoryValue(p),
    price: String(p.price ?? ""),
    compareAt: p.compareAt != null ? String(p.compareAt) : "",
    saleDiscountPercent: p.saleDiscountPercent != null ? String(p.saleDiscountPercent) : "",
    short: p.short || "",
    description: p.description || "",
    images: p.images || [],
    videos: p.videos || [],
    specs: p.specs?.length ? p.specs : [{ label: "", value: "" }],
    colors: p.colors || [],
    sizes: p.sizes || [],
    stock: String(stock),
    soldCount: String(p.soldCount ?? 0),
    rating: String(p.rating ?? 0),
    reviewCount: String(p.reviewCount ?? 0),
    ratingLocked: Boolean(p.ratingLocked),
    // Stock wins: quantity > 0 means available on the storefront.
    inStock: stock > 0,
    isActive: p.isActive !== false,
    flags: p.flags || [],
  };
}

function AdminProducts() {
  const qc = useQueryClient();
  const { refreshCatalog } = useStore();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ProductDoc | null | "new">(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => adminApi.products(),
  });

  const { data: catData } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => adminApi.categories(),
  });

  const products = useMemo(() => {
    const list = data?.products || [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.slug.toLowerCase().includes(needle) ||
        p.brand?.toLowerCase().includes(needle),
    );
  }, [data, q]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        brand: form.brand.trim(),
        category: form.category.trim(),
        price: Number(form.price) || 0,
        compareAt: form.compareAt ? Number(form.compareAt) : undefined,
        saleDiscountPercent: form.saleDiscountPercent
          ? Number(form.saleDiscountPercent)
          : undefined,
        short: form.short,
        description: form.description,
        images: form.images,
        videos: form.videos,
        specs: form.specs.filter((s) => s.label.trim() || s.value.trim()),
        colors: form.colors.filter((c) => c.label.trim()),
        sizes: form.sizes.filter((s) => s.label.trim()),
        stock: Number(form.stock) || 0,
        soldCount: Number(form.soldCount) || 0,
        rating: Number(form.rating) || 0,
        reviewCount: Number(form.reviewCount) || 0,
        ratingLocked: form.ratingLocked,
        // Raising quantity clears sold-out; zero stock marks it sold out.
        inStock: (Number(form.stock) || 0) > 0,
        isActive: form.isActive,
        flags: form.flags,
      };
      const id = editing && editing !== "new" ? editing._id : undefined;
      return adminApi.saveProduct(body, id);
    },
    onSuccess: () => {
      toast.success(editing === "new" ? "Product created" : "Product updated");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      void refreshCatalog();
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openNew() {
    setForm(emptyForm());
    setEditing("new");
  }

  function openEdit(p: ProductDoc) {
    const next = fromProduct(p);
    const cats = catData?.categories || [];
    if (next.category && cats.length) {
      const match =
        cats.find((c) => c.slug === next.category) ||
        cats.find((c) => c.name === next.category) ||
        cats.find((c) => c._id === next.category);
      if (match) next.category = match.slug;
    }
    setForm(next);
    setEditing(p);
  }

  function toggleFlag(flag: "new" | "hot" | "sale") {
    setForm((f) => ({
      ...f,
      flags: f.flags.includes(flag) ? f.flags.filter((x) => x !== flag) : [...f.flags, flag],
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Catalog
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em]">Products</h1>
        </div>
        <button type="button" className={adminBtn} onClick={openNew}>
          Add product
        </button>
      </div>

      <input
        className={adminField + " max-w-md"}
        placeholder="Search products…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {isLoading ? (
        <p className="font-mono text-xs text-muted-foreground">Loading…</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-mist/40 font-mono text-[10px] uppercase tracking-[0.16em]">
              <tr>
                <th className="px-3 py-3 font-normal">Product</th>
                <th className="px-3 py-3 font-normal">Category</th>
                <th className="px-3 py-3 font-normal">Price</th>
                <th className="px-3 py-3 font-normal">Stock</th>
                <th className="px-3 py-3 font-normal">Flags</th>
                <th className="px-3 py-3 font-normal" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-mist/30">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img
                          src={mediaUrl(p.images[0])}
                          alt=""
                          className="h-12 w-12 border border-border object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 border border-border bg-mist" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {(catData?.categories || []).find(
                      (c) => c.slug === p.category || c.slug === p.categorySlug || c.name === p.category,
                    )?.name ||
                      p.categorySlug ||
                      p.category ||
                      "—"}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{pkr(p.price)}</td>
                  <td className="px-3 py-3 font-mono text-xs">{p.stock}</td>
                  <td className="px-3 py-3 font-mono text-[10px] uppercase tracking-[0.12em]">
                    {(p.flags || []).join(" · ") || "—"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button type="button" className={adminBtnGhost} onClick={() => openEdit(p)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center font-mono text-xs text-muted-foreground"
                  >
                    No products
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-foreground/40">
          <div className="flex h-full w-full max-w-xl flex-col border-l border-border bg-background">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">
                {editing === "new" ? "New product" : "Edit product"}
              </h2>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center"
                onClick={() => setEditing(null)}
              >
                <X width={18} height={18} />
              </button>
            </div>
            <form
              className="flex-1 space-y-4 overflow-y-auto p-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveMut.mutate();
              }}
            >
              <Field label="Name">
                <input
                  required
                  className={adminField}
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      slug: editing === "new" ? slugify(e.target.value) : f.slug,
                    }))
                  }
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Slug">
                  <input
                    required
                    className={adminField}
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  />
                </Field>
                <Field label="Brand">
                  <input
                    className={adminField}
                    value={form.brand}
                    onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label="Category">
                <select
                  className={adminField}
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  required
                >
                  <option value="">Select…</option>
                  {(catData?.categories || []).map((c) => (
                    <option key={c._id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Price (PKR)">
                  <input
                    required
                    type="number"
                    min={0}
                    className={adminField}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </Field>
                <Field label="Compare at">
                  <input
                    type="number"
                    min={0}
                    className={adminField}
                    value={form.compareAt}
                    onChange={(e) => setForm((f) => ({ ...f, compareAt: e.target.value }))}
                  />
                </Field>
                <Field label="Sale %">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={adminField}
                    value={form.saleDiscountPercent}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, saleDiscountPercent: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <Field label="Short">
                <input
                  className={adminField}
                  value={form.short}
                  onChange={(e) => setForm((f) => ({ ...f, short: e.target.value }))}
                />
              </Field>
              <Field label="Description">
                <textarea
                  rows={4}
                  className={adminTextarea}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </Field>
              <Field label="Images">
                <Uploader
                  value={form.images}
                  onChange={(images) => setForm((f) => ({ ...f, images }))}
                  accept="image/*"
                />
              </Field>
              <Field label="Videos">
                <Uploader
                  value={form.videos}
                  onChange={(videos) => setForm((f) => ({ ...f, videos }))}
                  accept="video/*"
                />
              </Field>

              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Specs
                </p>
                <div className="space-y-2">
                  {form.specs.map((s, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <input
                        className={adminField}
                        placeholder="Label"
                        value={s.label}
                        onChange={(e) =>
                          setForm((f) => {
                            const specs = [...f.specs];
                            specs[i] = { ...specs[i], label: e.target.value };
                            return { ...f, specs };
                          })
                        }
                      />
                      <input
                        className={adminField}
                        placeholder="Value"
                        value={s.value}
                        onChange={(e) =>
                          setForm((f) => {
                            const specs = [...f.specs];
                            specs[i] = { ...specs[i], value: e.target.value };
                            return { ...f, specs };
                          })
                        }
                      />
                      <button
                        type="button"
                        className={adminBtnGhost}
                        onClick={() =>
                          setForm((f) => ({ ...f, specs: f.specs.filter((_, j) => j !== i) }))
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={adminBtnGhost}
                    onClick={() =>
                      setForm((f) => ({ ...f, specs: [...f.specs, { label: "", value: "" }] }))
                    }
                  >
                    Add spec
                  </button>
                </div>
              </div>

              <VariantEditor
                title="Colors"
                items={form.colors}
                onChange={(colors) => setForm((f) => ({ ...f, colors }))}
                type="color"
              />
              <VariantEditor
                title="Sizes"
                items={form.sizes}
                onChange={(sizes) => setForm((f) => ({ ...f, sizes }))}
                type="size"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Stock">
                  <input
                    type="number"
                    min={0}
                    className={adminField}
                    value={form.stock}
                    onChange={(e) => {
                      const stock = e.target.value;
                      setForm((f) => ({
                        ...f,
                        stock,
                        inStock: (Number(stock) || 0) > 0,
                      }));
                    }}
                  />
                </Field>
                <Field label="Sold quantity">
                  <input
                    type="number"
                    min={0}
                    className={adminField}
                    value={form.soldCount}
                    onChange={(e) => setForm((f) => ({ ...f, soldCount: e.target.value }))}
                  />
                </Field>
                <Field label="Rating (0–5)">
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    className={adminField}
                    value={form.rating}
                    onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                  />
                </Field>
                <Field label="Review count">
                  <input
                    type="number"
                    min={0}
                    className={adminField}
                    value={form.reviewCount}
                    onChange={(e) => setForm((f) => ({ ...f, reviewCount: e.target.value }))}
                  />
                </Field>
                <div className="flex flex-wrap items-end gap-4 pb-2 sm:col-span-2">
                  <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
                    <input
                      type="checkbox"
                      checked={form.inStock}
                      onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))}
                    />
                    In stock
                  </label>
                  <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
                    <input
                      type="checkbox"
                      checked={form.ratingLocked}
                      onChange={(e) => setForm((f) => ({ ...f, ratingLocked: e.target.checked }))}
                    />
                    Lock rating (admin controlled)
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(["new", "hot", "sale"] as const).map((flag) => (
                  <button
                    key={flag}
                    type="button"
                    className={form.flags.includes(flag) ? adminBtn : adminBtnOutline}
                    onClick={() => toggleFlag(flag)}
                  >
                    {flag}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <button type="submit" className={adminBtn} disabled={saveMut.isPending}>
                  {saveMut.isPending ? "Saving…" : "Save"}
                </button>
                <button type="button" className={adminBtnOutline} onClick={() => setEditing(null)}>
                  Cancel
                </button>
                {editing !== "new" && (
                  <button
                    type="button"
                    className={adminBtnGhost}
                    onClick={() => {
                      if (confirm("Delete this product?")) delMut.mutate(editing._id);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function VariantEditor({
  title,
  items,
  onChange,
  type,
}: {
  title: string;
  items: VariantDoc[];
  onChange: (v: VariantDoc[]) => void;
  type: VariantDoc["type"];
}) {
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </p>
      <div className="space-y-2">
        {items.map((v, i) => (
          <div key={i} className="space-y-2 border border-border p-2">
            <div className="grid gap-2 sm:grid-cols-[minmax(140px,1fr)_90px_70px_70px_auto]">
              <input
                className={adminField}
                placeholder={type === "color" ? "Colour name" : "Label"}
                value={v.label}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], label: e.target.value };
                  onChange(next);
                }}
              />
              {type === "color" && (
                <label className="flex h-11 cursor-pointer items-center gap-2 border border-border px-2">
                  <input
                    type="color"
                    value={v.value || "#111111"}
                    aria-label={`Pick ${v.label || "colour"}`}
                    className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0"
                    onChange={(e) => {
                      const next = [...items];
                      next[i] = { ...next[i], value: e.target.value };
                      onChange(next);
                    }}
                  />
                  <span className="font-mono text-[9px] uppercase text-muted-foreground">
                    {v.value || "#111111"}
                  </span>
                </label>
              )}
              <input
                type="number"
                className={adminField}
                placeholder="Stock"
                value={v.stock ?? ""}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], stock: Number(e.target.value) || 0 };
                  onChange(next);
                }}
              />
              <input
                type="number"
                className={adminField}
                placeholder="Δ PKR"
                value={v.priceDelta ?? ""}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], priceDelta: Number(e.target.value) || 0 };
                  onChange(next);
                }}
              />
              <button
                type="button"
                className={adminBtnGhost}
                onClick={() => onChange(items.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </div>
            {type === "color" && (
              <Uploader
                value={v.image ? [v.image] : []}
                onChange={(urls) => {
                  const next = [...items];
                  next[i] = { ...next[i], image: urls[0] || "" };
                  onChange(next);
                }}
                multiple={false}
                accept="image/*"
                label="Swatch"
              />
            )}
          </div>
        ))}
        <button
          type="button"
          className={adminBtnGhost}
          onClick={() =>
            onChange([
              ...items,
              {
                label: "",
                type,
                value: type === "color" ? "#111111" : "",
                stock: 0,
                priceDelta: 0,
              },
            ])
          }
        >
          Add {title.toLowerCase().slice(0, -1)}
        </button>
      </div>
    </div>
  );
}
