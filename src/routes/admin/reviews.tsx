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
} from "@/components/admin/field";
import { SingleUploader, Uploader } from "@/components/admin/uploader";
import { adminApi, mediaUrl, type ProductDoc, type ReviewDoc } from "@/lib/api";

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviews,
  head: () => ({ meta: [{ title: "Reviews — Aperture Admin" }] }),
});

type Form = {
  author: string;
  authorImage: string;
  rating: string;
  title: string;
  body: string;
  images: string[];
  videos: string[];
  productId: string;
  isApproved: boolean;
  date: string;
};

const empty = (): Form => ({
  author: "",
  authorImage: "",
  rating: "5",
  title: "",
  body: "",
  images: [],
  videos: [],
  productId: "",
  isApproved: true,
  date: new Date().toISOString().slice(0, 10),
});

function productIdFromReview(
  r: ReviewDoc,
  products: { _id: string; name?: string; slug?: string }[],
) {
  if (typeof r.product === "string" && r.product) {
    const byId = products.find((p) => p._id === r.product);
    if (byId) return byId._id;
  }
  if (typeof r.product === "object" && r.product) {
    const reviewProduct = r.product;
    if (reviewProduct._id) {
      const byId = products.find((p) => p._id === reviewProduct._id);
      if (byId) return byId._id;
    }
    const bySlug = products.find(
      (p) => p.slug === reviewProduct.slug || p.name === reviewProduct.name,
    );
    if (bySlug) return bySlug._id;
  }
  return "";
}

function productCategorySlugs(p?: ProductDoc | null) {
  if (!p) return [] as string[];
  const fromArrays = [
    ...(Array.isArray(p.categorySlugs) ? p.categorySlugs : []),
    ...(Array.isArray(p.categories) ? p.categories : []),
  ]
    .map((s) => String(s || "").trim())
    .filter(Boolean);
  if (fromArrays.length) return Array.from(new Set(fromArrays));
  if (typeof p.categorySlug === "string" && p.categorySlug) return [p.categorySlug];
  if (typeof p.category === "string" && p.category) return [p.category];
  return [];
}

function reviewProductId(r: ReviewDoc) {
  if (typeof r.product === "string") return r.product;
  if (typeof r.product === "object" && r.product?._id) return r.product._id;
  return "";
}

function AdminReviews() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ReviewDoc | null | "new">(null);
  const [form, setForm] = useState<Form>(empty());
  const [q, setQ] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "hidden">("all");
  const [ratingFilter, setRatingFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => adminApi.reviews(),
  });

  const { data: products } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => adminApi.products(),
  });

  const { data: catData } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => adminApi.categories(),
  });

  const productById = useMemo(() => {
    const map = new Map<string, ProductDoc>();
    for (const p of products?.products || []) map.set(p._id, p);
    return map;
  }, [products]);

  const filteredReviews = useMemo(() => {
    const list = data?.reviews || [];
    const needle = q.trim().toLowerCase();
    const ratingNum = ratingFilter ? Number(ratingFilter) : null;

    return list.filter((r) => {
      const pid = reviewProductId(r) || productIdFromReview(r, products?.products || []);
      const product = pid ? productById.get(pid) : undefined;
      const productName =
        (typeof r.product === "object" && r.product?.name) || product?.name || "";
      const productSlug =
        (typeof r.product === "object" && r.product?.slug) || product?.slug || "";

      if (productFilter) {
        const populatedId =
          typeof r.product === "object" && r.product?._id ? r.product._id : "";
        if (pid !== productFilter && populatedId !== productFilter) return false;
      }

      if (categoryFilter) {
        const fromProduct = product ? productCategorySlugs(product) : [];
        const fromPopulated =
          typeof r.product === "object" && r.product
            ? [
                ...((r.product as { categorySlugs?: string[] }).categorySlugs || []),
                ...((r.product as { categories?: string[] }).categories || []),
                (r.product as { categorySlug?: string }).categorySlug || "",
              ].filter(Boolean)
            : [];
        const slugs = Array.from(new Set([...fromProduct, ...fromPopulated]));
        if (!slugs.includes(categoryFilter)) return false;
      }

      if (statusFilter === "approved" && r.isApproved === false) return false;
      if (statusFilter === "hidden" && r.isApproved !== false) return false;

      if (ratingNum != null && !Number.isNaN(ratingNum) && Number(r.rating) !== ratingNum) {
        return false;
      }

      if (!needle) return true;
      const hay = [
        r.author,
        r.title,
        r.body,
        productName,
        productSlug,
        String(r.rating),
        (r.date || r.createdAt || "").slice(0, 10),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [
    data?.reviews,
    q,
    productFilter,
    categoryFilter,
    statusFilter,
    ratingFilter,
    productById,
    products?.products,
  ]);

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        author: form.author.trim(),
        authorImage: form.authorImage,
        rating: Number(form.rating) || 5,
        title: form.title,
        body: form.body,
        images: form.images,
        videos: form.videos,
        productId: form.productId,
        isApproved: form.isApproved,
        date: form.date || undefined,
      };
      const id = editing && editing !== "new" ? editing._id || editing.id : undefined;
      return adminApi.saveReview(body, id);
    },
    onSuccess: () => {
      toast.success(editing === "new" ? "Review created" : "Review updated");
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      setEditing(null);
      setForm(empty());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteReview(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function productLabel(r: ReviewDoc) {
    if (typeof r.product === "object" && r.product?.name) return r.product.name;
    if (typeof r.product === "string") {
      const p = productById.get(r.product);
      return p?.name || r.product;
    }
    return "—";
  }

  function openEdit(r: ReviewDoc) {
    setForm({
      author: r.author || "",
      authorImage: r.authorImage || "",
      rating: String(r.rating ?? 5),
      title: r.title || "",
      body: r.body || "",
      images: r.images || [],
      videos: r.videos || [],
      productId: productIdFromReview(r, products?.products || []),
      isApproved: r.isApproved !== false,
      date: (r.date || r.createdAt || "").toString().slice(0, 10) || new Date().toISOString().slice(0, 10),
    });
    setEditing(r);
  }

  const hasActiveFilters =
    Boolean(q.trim()) ||
    Boolean(productFilter) ||
    Boolean(categoryFilter) ||
    statusFilter !== "all" ||
    Boolean(ratingFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Social proof
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em]">Reviews</h1>
        </div>
        <button
          type="button"
          className={adminBtn}
          onClick={() => {
            setForm(empty());
            setEditing("new");
          }}
        >
          Add review
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <input
          className={adminField + " sm:col-span-2 lg:col-span-2"}
          placeholder="Search author, product, body…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={adminField}
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          aria-label="Filter by product"
        >
          <option value="">All products</option>
          {(products?.products || []).map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className={adminField}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {(catData?.categories || []).map((c) => (
            <option key={c._id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <select
            className={adminField}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "approved" | "hidden")}
            aria-label="Filter by status"
          >
            <option value="all">All status</option>
            <option value="approved">Approved</option>
            <option value="hidden">Hidden</option>
          </select>
          <select
            className={adminField}
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            aria-label="Filter by rating"
          >
            <option value="">All ★</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={String(n)}>
                {n}★
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Showing {filteredReviews.length}
          {(data?.reviews || []).length !== filteredReviews.length
            ? ` of ${(data?.reviews || []).length}`
            : ""}{" "}
          reviews
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            className={adminBtnGhost}
            onClick={() => {
              setQ("");
              setProductFilter("");
              setCategoryFilter("");
              setStatusFilter("all");
              setRatingFilter("");
            }}
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <p className="font-mono text-xs text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((r) => {
            const id = r._id || r.id || "";
            return (
              <div key={id} className="border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-3">
                    {r.authorImage ? (
                      <img
                        src={mediaUrl(r.authorImage)}
                        alt=""
                        className="h-10 w-10 border border-border object-cover"
                      />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center border border-border font-mono text-xs">
                        {(r.author || "?")[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{r.author}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {r.rating}/5 · {productLabel(r)} ·{" "}
                        {(r.date || r.createdAt || "").slice(0, 10) || "—"} ·{" "}
                        {r.isApproved === false ? "Hidden" : "Approved"}
                      </p>
                      {r.title && <p className="mt-1 text-sm">{r.title}</p>}
                      <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={adminBtnGhost}
                      onClick={() => {
                        const reviewId = r._id || r.id;
                        if (!reviewId) return;
                        void adminApi
                          .saveReview({ isApproved: r.isApproved === false }, reviewId)
                          .then(() => {
                            toast.success(
                              r.isApproved === false ? "Review approved" : "Review hidden",
                            );
                            qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
                          })
                          .catch((e: Error) => toast.error(e.message));
                      }}
                    >
                      {r.isApproved === false ? "Approve" : "Hide"}
                    </button>
                    <button type="button" className={adminBtnGhost} onClick={() => openEdit(r)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className={adminBtnGhost}
                      onClick={() => {
                        if (id && confirm("Delete review?")) delMut.mutate(id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredReviews.length === 0 && (
            <p className="font-mono text-xs text-muted-foreground">
              {hasActiveFilters ? "No reviews match these filters" : "No reviews"}
            </p>
          )}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-foreground/40">
          <div className="flex h-full w-full max-w-md flex-col border-l border-border bg-background">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">
                {editing === "new" ? "New review" : "Edit review"}
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
              className="space-y-4 overflow-y-auto p-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveMut.mutate();
              }}
            >
              <Field label="Author">
                <input
                  required
                  className={adminField}
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                />
              </Field>
              <Field label="Author image">
                <SingleUploader
                  value={form.authorImage}
                  onChange={(authorImage) => setForm((f) => ({ ...f, authorImage }))}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Rating">
                  <input
                    type="number"
                    min={1}
                    max={5}
                    required
                    className={adminField}
                    value={form.rating}
                    onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                  />
                </Field>
                <Field label="Date added">
                  <input
                    type="date"
                    required
                    className={adminField}
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label="Product">
                <select
                  required
                  className={adminField}
                  value={form.productId}
                  onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                >
                  <option value="">Select…</option>
                  {(products?.products || []).map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Title">
                <input
                  className={adminField}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </Field>
              <Field label="Body">
                <textarea
                  required
                  rows={4}
                  className={adminTextarea}
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
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
              <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
                <input
                  type="checkbox"
                  checked={form.isApproved}
                  onChange={(e) => setForm((f) => ({ ...f, isApproved: e.target.checked }))}
                />
                Approved (visible on storefront)
              </label>
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
                      const id = editing._id || editing.id;
                      if (id && confirm("Delete review?")) delMut.mutate(id);
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
