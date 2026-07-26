import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import { adminApi, mediaUrl, type ReviewDoc } from "@/lib/api";

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
    const bySlug = products.find(
      (p) => p.slug === reviewProduct.slug || p.name === reviewProduct.name,
    );
    if (bySlug) return bySlug._id;
  }
  return "";
}

function AdminReviews() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ReviewDoc | null | "new">(null);
  const [form, setForm] = useState<Form>(empty());

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => adminApi.reviews(),
  });

  const { data: products } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => adminApi.products(),
  });

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
      const p = (products?.products || []).find((x) => x._id === r.product);
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
    });
    setEditing(r);
  }

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

      {isLoading ? (
        <p className="font-mono text-xs text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          {(data?.reviews || []).map((r) => {
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
                        {r.rating}/5 · {productLabel(r)}
                      </p>
                      {r.title && <p className="mt-1 text-sm">{r.title}</p>}
                      <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
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
          {(data?.reviews || []).length === 0 && (
            <p className="font-mono text-xs text-muted-foreground">No reviews</p>
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
              </div>
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
