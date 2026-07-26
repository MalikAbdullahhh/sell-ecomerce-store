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
  slugify,
} from "@/components/admin/field";
import { SingleUploader } from "@/components/admin/uploader";
import { adminApi, mediaUrl, type CategoryDoc } from "@/lib/api";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
  head: () => ({ meta: [{ title: "Categories — Aperture Admin" }] }),
});

type Form = {
  name: string;
  slug: string;
  blurb: string;
  image: string;
  sortOrder: string;
  isActive: boolean;
};

const empty = (): Form => ({
  name: "",
  slug: "",
  blurb: "",
  image: "",
  sortOrder: "0",
  isActive: true,
});

function AdminCategories() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<CategoryDoc | null | "new">(null);
  const [form, setForm] = useState<Form>(empty());

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => adminApi.categories(),
  });

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        blurb: form.blurb,
        image: form.image,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      const id = editing && editing !== "new" ? editing._id : undefined;
      return adminApi.saveCategory(body, id);
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Catalog
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em]">
            Categories
          </h1>
        </div>
        <button
          type="button"
          className={adminBtn}
          onClick={() => {
            setForm(empty());
            setEditing("new");
          }}
        >
          Add category
        </button>
      </div>

      {isLoading ? (
        <p className="font-mono text-xs text-muted-foreground">Loading…</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-mist/40 font-mono text-[10px] uppercase tracking-[0.16em]">
              <tr>
                <th className="px-3 py-3 font-normal">Category</th>
                <th className="px-3 py-3 font-normal">Slug</th>
                <th className="px-3 py-3 font-normal">Order</th>
                <th className="px-3 py-3 font-normal">Active</th>
                <th className="px-3 py-3 font-normal" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.categories || []).map((c) => (
                <tr key={c._id} className="hover:bg-mist/30">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      {c.image ? (
                        <img
                          src={mediaUrl(c.image)}
                          alt=""
                          className="h-10 w-10 border border-border object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 border border-border bg-mist" />
                      )}
                      <div>
                        <p>{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.blurb}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{c.slug}</td>
                  <td className="px-3 py-3 font-mono text-xs">{c.sortOrder ?? 0}</td>
                  <td className="px-3 py-3 font-mono text-[10px] uppercase">
                    {c.isActive === false ? "No" : "Yes"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      className={adminBtnGhost}
                      onClick={() => {
                        setForm({
                          name: c.name,
                          slug: c.slug,
                          blurb: c.blurb || "",
                          image: c.image || "",
                          sortOrder: String(c.sortOrder ?? 0),
                          isActive: c.isActive !== false,
                        });
                        setEditing(c);
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-foreground/40">
          <div className="flex h-full w-full max-w-md flex-col border-l border-border bg-background">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">
                {editing === "new" ? "New category" : "Edit category"}
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
              <Field label="Slug">
                <input
                  required
                  className={adminField}
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
              </Field>
              <Field label="Blurb">
                <textarea
                  rows={3}
                  className={adminTextarea}
                  value={form.blurb}
                  onChange={(e) => setForm((f) => ({ ...f, blurb: e.target.value }))}
                />
              </Field>
              <Field label="Image">
                <SingleUploader
                  value={form.image}
                  onChange={(image) => setForm((f) => ({ ...f, image }))}
                />
              </Field>
              <Field label="Sort order">
                <input
                  type="number"
                  className={adminField}
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </Field>
              <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Active
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
                      if (confirm("Delete category?")) delMut.mutate(editing._id);
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
