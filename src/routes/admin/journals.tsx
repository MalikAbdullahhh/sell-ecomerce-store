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
  Field,
  slugify,
} from "@/components/admin/field";
import { SingleUploader } from "@/components/admin/uploader";
import { RichEditor } from "@/components/admin/rich-editor";
import { adminApi, mediaUrl, type JournalDoc } from "@/lib/api";

export const Route = createFileRoute("/admin/journals")({
  component: AdminJournals,
  head: () => ({ meta: [{ title: "Journals — Aperture Admin" }] }),
});

type Form = {
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  category: string;
  readTime: string;
  date: string;
  contentHtml: string;
  isPublished: boolean;
};

const empty = (): Form => ({
  title: "",
  slug: "",
  excerpt: "",
  image: "",
  category: "Field notes",
  readTime: "5 min",
  date: new Date().toISOString().slice(0, 10),
  contentHtml: "",
  isPublished: true,
});

function AdminJournals() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<JournalDoc | null | "new">(null);
  const [form, setForm] = useState<Form>(empty());

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "journals"],
    queryFn: () => adminApi.journals(),
  });

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        excerpt: form.excerpt,
        image: form.image,
        category: form.category,
        readTime: form.readTime,
        contentHtml: form.contentHtml,
        isPublished: form.isPublished,
        date: form.date || new Date().toISOString().slice(0, 10),
      };
      const id = editing && editing !== "new" ? editing._id : undefined;
      return adminApi.saveJournal(body, id);
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin", "journals"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteJournal(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "journals"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Editorial
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em]">Journals</h1>
        </div>
        <button
          type="button"
          className={adminBtn}
          onClick={() => {
            setForm(empty());
            setEditing("new");
          }}
        >
          New post
        </button>
      </div>

      {isLoading ? (
        <p className="font-mono text-xs text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.posts || []).map((p) => (
            <button
              key={p._id}
              type="button"
              className="border border-border text-left transition-colors hover:bg-mist/30"
              onClick={() => {
                setForm({
                  title: p.title,
                  slug: p.slug,
                  excerpt: p.excerpt || "",
                  image: p.image || "",
                  category: p.category || "",
                  readTime: p.readTime || "",
                  date: (p.date || "").slice(0, 10) || new Date().toISOString().slice(0, 10),
                  contentHtml:
                    p.contentHtml || (p.body || []).map((b) => `<p>${b}</p>`).join("") || "",
                  isPublished: p.isPublished !== false,
                });
                setEditing(p);
              }}
            >
              {p.image ? (
                <img
                  src={mediaUrl(p.image)}
                  alt=""
                  className="aspect-[16/10] w-full object-cover"
                />
              ) : (
                <div className="aspect-[16/10] w-full bg-mist" />
              )}
              <div className="p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {p.category} · {p.readTime}
                </p>
                <p className="mt-1 font-medium">{p.title}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-foreground/40">
          <div className="flex h-full w-full max-w-2xl flex-col border-l border-border bg-background">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">
                {editing === "new" ? "New journal" : "Edit journal"}
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
              <Field label="Title">
                <input
                  required
                  className={adminField}
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      title: e.target.value,
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
                <Field label="Category">
                  <input
                    className={adminField}
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Read time">
                  <input
                    className={adminField}
                    value={form.readTime}
                    onChange={(e) => setForm((f) => ({ ...f, readTime: e.target.value }))}
                  />
                </Field>
                <Field label="Date">
                  <input
                    type="date"
                    className={adminField}
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label="Excerpt">
                <input
                  className={adminField}
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                />
              </Field>
              <Field label="Cover image">
                <SingleUploader
                  value={form.image}
                  onChange={(image) => setForm((f) => ({ ...f, image }))}
                />
              </Field>
              <Field label="Content">
                <RichEditor
                  value={form.contentHtml}
                  onChange={(contentHtml) => setForm((f) => ({ ...f, contentHtml }))}
                />
              </Field>
              <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                />
                Published
              </label>
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <button type="submit" className={adminBtn} disabled={saveMut.isPending}>
                  Save
                </button>
                <button type="button" className={adminBtnOutline} onClick={() => setEditing(null)}>
                  Cancel
                </button>
                {editing !== "new" && (
                  <button
                    type="button"
                    className={adminBtnGhost}
                    onClick={() => {
                      if (confirm("Delete post?")) delMut.mutate(editing._id);
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
