import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { adminBtn, adminBtnGhost, adminField, adminLabel } from "@/components/admin/field";
import { Uploader } from "@/components/admin/uploader";
import { AdminTableSkeleton } from "@/components/site/skeletons";
import { adminApi, mediaUrl, type TestimonialDoc } from "@/lib/api";

export const Route = createFileRoute("/admin/testimonials")({
  component: AdminTestimonials,
  head: () => ({ meta: [{ title: "Testimonials — Aperture Admin" }] }),
});

type FormState = {
  name: string;
  handle: string;
  email: string;
  role: string;
  quote: string;
  image: string;
  platform: NonNullable<TestimonialDoc["platform"]>;
  likes: string;
  comments: string;
  layout: "meta-top" | "meta-bottom";
  row: "1" | "2";
  rating: string;
  dateAdded: string;
  isActive: boolean;
  sortOrder: string;
};

const empty: FormState = {
  name: "",
  handle: "",
  email: "",
  role: "",
  quote: "",
  image: "",
  platform: "instagram",
  likes: "0",
  comments: "0",
  layout: "meta-bottom",
  row: "1",
  rating: "5",
  dateAdded: new Date().toISOString().slice(0, 10),
  isActive: true,
  sortOrder: "0",
};

function fromDoc(t: TestimonialDoc): FormState {
  return {
    name: t.name || "",
    handle: t.handle || "",
    email: t.email || "",
    role: t.role || "",
    quote: t.quote || "",
    image: t.image || "",
    platform: t.platform || "instagram",
    likes: String(t.likes ?? 0),
    comments: String(t.comments ?? 0),
    layout: t.layout || "meta-bottom",
    row: String(t.row || 1) as "1" | "2",
    rating: String(t.rating ?? 5),
    dateAdded: t.dateAdded ? t.dateAdded.slice(0, 10) : new Date().toISOString().slice(0, 10),
    isActive: t.isActive !== false,
    sortOrder: String(t.sortOrder ?? 0),
  };
}

function AdminTestimonials() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<TestimonialDoc | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "testimonials"],
    queryFn: () => adminApi.testimonials(),
  });

  const saveMut = useMutation({
    mutationFn: () => {
      const body: Partial<TestimonialDoc> = {
        name: form.name.trim(),
        handle: form.handle.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        quote: form.quote.trim(),
        image: form.image,
        platform: form.platform,
        likes: Number(form.likes) || 0,
        comments: Number(form.comments) || 0,
        layout: form.layout,
        row: Number(form.row) as 1 | 2,
        rating: Number(form.rating) || 5,
        dateAdded: form.dateAdded,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
      };
      return adminApi.saveTestimonial(body, editing?._id);
    },
    onSuccess: () => {
      toast.success(editing ? "Updated" : "Created");
      qc.invalidateQueries({ queryKey: ["admin", "testimonials"] });
      setOpen(false);
      setEditing(null);
      setForm(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteTestimonial(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "testimonials"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Social proof
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em]">
            Testimonials
          </h1>
        </div>
        <button
          type="button"
          className={adminBtn}
          onClick={() => {
            setEditing(null);
            setForm(empty);
            setOpen(true);
          }}
        >
          Add card
        </button>
      </div>

      {isLoading ? (
        <AdminTableSkeleton />
      ) : isError ? (
        <div className="border border-border p-6">
          <p className="text-sm text-muted-foreground">
            Could not load testimonials: {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <button type="button" className={`${adminBtn} mt-4`} onClick={() => refetch()}>
            Retry
          </button>
        </div>
      ) : (data?.testimonials || []).length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">
          No testimonials yet — add your first card.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(data?.testimonials || []).map((t) => (
            <article key={t._id} className="border border-border p-4">
              <div className="flex items-center gap-3">
                <img
                  src={
                    mediaUrl(t.image) || `https://api.dicebear.com/7.x/initials/svg?seed=${t.name}`
                  }
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">
                    {t.handle || t.email || t.platform} · row {t.row || 1}
                    {!t.isActive && " · hidden"}
                  </p>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{t.quote}</p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className={adminBtnGhost}
                  onClick={() => {
                    setEditing(t);
                    setForm(fromDoc(t));
                    setOpen(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={adminBtnGhost}
                  onClick={() => {
                    if (confirm("Delete this testimonial?")) deleteMut.mutate(t._id);
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[120] grid place-items-end bg-foreground/40 sm:place-items-center sm:p-4">
          <form
            className="max-h-[92vh] w-full max-w-xl space-y-3 overflow-y-auto border border-border bg-background p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name.trim() || !form.quote.trim()) {
                toast.error("Name and quote are required");
                return;
              }
              saveMut.mutate();
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">{editing ? "Edit card" : "New card"}</h2>
              <button type="button" className={adminBtnGhost} onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <label className="block space-y-1">
              <span className={adminLabel}>Name</span>
              <input
                className={adminField}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className={adminLabel}>Handle</span>
                <input
                  className={adminField}
                  placeholder="@username"
                  value={form.handle}
                  onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))}
                />
              </label>
              <label className="block space-y-1">
                <span className={adminLabel}>Email</span>
                <input
                  className={adminField}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className={adminLabel}>Quote / description</span>
              <textarea
                className={adminField + " min-h-28 py-3"}
                value={form.quote}
                onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
              />
            </label>
            <Uploader
              label="Avatar image"
              multiple={false}
              accept="image/*"
              value={form.image ? [form.image] : []}
              onChange={(urls) => setForm((f) => ({ ...f, image: urls[0] || "" }))}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block space-y-1">
                <span className={adminLabel}>Platform</span>
                <select
                  className={adminField}
                  value={form.platform}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      platform: e.target.value as FormState["platform"],
                    }))
                  }
                >
                  {["instagram", "facebook", "twitter", "x", "other"].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className={adminLabel}>Likes</span>
                <input
                  className={adminField}
                  value={form.likes}
                  onChange={(e) => setForm((f) => ({ ...f, likes: e.target.value }))}
                />
              </label>
              <label className="block space-y-1">
                <span className={adminLabel}>Comments</span>
                <input
                  className={adminField}
                  value={form.comments}
                  onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block space-y-1">
                <span className={adminLabel}>Layout</span>
                <select
                  className={adminField}
                  value={form.layout}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      layout: e.target.value as FormState["layout"],
                    }))
                  }
                >
                  <option value="meta-bottom">Person top</option>
                  <option value="meta-top">Meta top</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className={adminLabel}>Marquee row</span>
                <select
                  className={adminField}
                  value={form.row}
                  onChange={(e) => setForm((f) => ({ ...f, row: e.target.value as "1" | "2" }))}
                >
                  <option value="1">Row 1 →</option>
                  <option value="2">Row 2 ←</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className={adminLabel}>Date added</span>
                <input
                  type="date"
                  className={adminField}
                  value={form.dateAdded}
                  onChange={(e) => setForm((f) => ({ ...f, dateAdded: e.target.value }))}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 font-mono text-xs">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active on storefront
            </label>
            <button type="submit" className={adminBtn} disabled={saveMut.isPending}>
              {saveMut.isPending ? "Saving…" : "Save"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
