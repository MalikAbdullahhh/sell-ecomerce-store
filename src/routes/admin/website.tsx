import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  adminBtn,
  adminBtnGhost,
  adminBtnOutline,
  adminField,
  adminTextarea,
  Field,
} from "@/components/admin/field";
import { RichEditor } from "@/components/admin/rich-editor";
import { SectionEditor } from "@/components/admin/section-editor";
import { adminApi, type FaqDoc, type LegalDocApi } from "@/lib/api";
import { PAGE_SCHEMA, mergeSection, type SectionValues } from "@/lib/page-schema";
import { invalidatePageContent } from "@/lib/page-content";

export const Route = createFileRoute("/admin/website")({
  component: AdminWebsite,
  head: () => ({ meta: [{ title: "Website CMS — Aperture Admin" }] }),
});

function AdminWebsite() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pages" | "faqs" | "policies">("pages");
  const [page, setPage] = useState(PAGE_SCHEMA[0].key);
  const [sections, setSections] = useState<Record<string, SectionValues>>({});
  const [faqForm, setFaqForm] = useState<
    Partial<FaqDoc> & { question: string; answer: string; group: string }
  >({
    group: "General",
    question: "",
    answer: "",
  });
  const [editingFaq, setEditingFaq] = useState<string | null>(null);
  const [legalForm, setLegalForm] = useState<LegalDocApi>({
    slug: "",
    title: "",
    summary: "",
    contentHtml: "<p></p>",
    isPublished: true,
    sortOrder: 0,
  });
  const [editingLegal, setEditingLegal] = useState<string | null>(null);

  const pageQ = useQuery({
    queryKey: ["admin", "page", page],
    queryFn: () => adminApi.page(page),
    enabled: tab === "pages",
  });

  const faqsQ = useQuery({
    queryKey: ["admin", "faqs"],
    queryFn: () => adminApi.faqs(),
    enabled: tab === "faqs",
  });

  const legalQ = useQuery({
    queryKey: ["admin", "legal"],
    queryFn: () => adminApi.legalDocs(),
    enabled: tab === "policies",
  });

  const pageSchema = PAGE_SCHEMA.find((p) => p.key === page) || PAGE_SCHEMA[0];

  // Saved content merged over schema defaults, so the form always starts filled
  // with exactly what the live page is showing.
  useEffect(() => {
    const saved = (pageQ.data?.page?.sections || {}) as Record<string, SectionValues>;
    setSections(
      Object.fromEntries(
        pageSchema.sections.map((s) => [s.key, mergeSection(page, s.key, saved[s.key])]),
      ),
    );
  }, [pageQ.data, page, pageSchema.sections]);

  const savePageMut = useMutation({
    mutationFn: () => adminApi.savePage(page, { title: pageSchema.label, sections, isPublished: true }),
    onSuccess: () => {
      toast.success(`${pageSchema.label} page saved`);
      invalidatePageContent(page);
      qc.invalidateQueries({ queryKey: ["admin", "page", page] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveFaqMut = useMutation({
    mutationFn: () =>
      adminApi.saveFaq(
        {
          group: faqForm.group,
          question: faqForm.question,
          answer: faqForm.answer,
          sortOrder: faqForm.sortOrder ?? 0,
          isActive: faqForm.isActive !== false,
        },
        editingFaq || undefined,
      ),
    onSuccess: () => {
      toast.success("FAQ saved");
      qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      setFaqForm({ group: "General", question: "", answer: "" });
      setEditingFaq(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delFaqMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteFaq(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveLegalMut = useMutation({
    mutationFn: () => {
      const body = {
        title: legalForm.title,
        summary: legalForm.summary || "",
        contentHtml: legalForm.contentHtml || "",
        sortOrder: Number(legalForm.sortOrder) || 0,
        isPublished: legalForm.isPublished !== false,
      };
      if (editingLegal) return adminApi.saveLegal(editingLegal, body);
      return adminApi.createLegal({ ...body, slug: legalForm.slug });
    },
    onSuccess: () => {
      toast.success("Policy saved");
      qc.invalidateQueries({ queryKey: ["admin", "legal"] });
      setEditingLegal(null);
      setLegalForm({
        slug: "",
        title: "",
        summary: "",
        contentHtml: "<p></p>",
        isPublished: true,
        sortOrder: 0,
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delLegalMut = useMutation({
    mutationFn: (slug: string) => adminApi.deleteLegal(slug),
    onSuccess: () => {
      toast.success("Policy deleted");
      qc.invalidateQueries({ queryKey: ["admin", "legal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          CMS
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em]">Website</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Edit each page section with plain labels — headings, photos, buttons, and lists. No keys
          or code. Save and the live storefront updates immediately.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["pages", "Pages"],
            ["faqs", "FAQs"],
            ["policies", "Terms & policies"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? adminBtn : adminBtnOutline}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "pages" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PAGE_SCHEMA.map((p) => (
              <button
                key={p.key}
                type="button"
                className={page === p.key ? adminBtn : adminBtnGhost}
                onClick={() => setPage(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {pageSchema.description && (
            <p className="text-sm text-muted-foreground">{pageSchema.description}</p>
          )}

          {pageQ.isLoading ? (
            <p className="font-mono text-xs text-muted-foreground">Loading page…</p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                savePageMut.mutate();
              }}
            >
              {pageSchema.sections.map((section) => (
                <SectionEditor
                  key={section.key}
                  page={pageSchema.key}
                  section={section}
                  values={sections[section.key] || {}}
                  onChange={(values) => setSections((s) => ({ ...s, [section.key]: values }))}
                />
              ))}

              <div className="sticky bottom-0 flex items-center gap-3 border-t border-border bg-background/95 py-4 backdrop-blur">
                <button type="submit" className={adminBtn} disabled={savePageMut.isPending}>
                  {savePageMut.isPending ? "Saving…" : `Save ${pageSchema.label} page`}
                </button>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Changes go live immediately
                </p>
              </div>
            </form>
          )}
        </div>
      )}

      {tab === "faqs" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {(faqsQ.data?.faqs || []).map((f) => (
              <div key={f._id} className="border border-border p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {f.group}
                </p>
                <p className="mt-1 font-medium">{f.question}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.answer}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className={adminBtnGhost}
                    onClick={() => {
                      setEditingFaq(f._id);
                      setFaqForm({
                        group: f.group,
                        question: f.question,
                        answer: f.answer,
                        sortOrder: f.sortOrder,
                        isActive: f.isActive,
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={adminBtnGhost}
                    onClick={() => {
                      if (confirm("Delete FAQ?")) delFaqMut.mutate(f._id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form
            className="h-fit space-y-3 border border-border p-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveFaqMut.mutate();
            }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.18em]">
              {editingFaq ? "Edit FAQ" : "New FAQ"}
            </p>
            <Field label="Group">
              <input
                className={adminField}
                value={faqForm.group}
                onChange={(e) => setFaqForm((f) => ({ ...f, group: e.target.value }))}
                required
              />
            </Field>
            <Field label="Question">
              <input
                className={adminField}
                value={faqForm.question}
                onChange={(e) => setFaqForm((f) => ({ ...f, question: e.target.value }))}
                required
              />
            </Field>
            <Field label="Answer">
              <textarea
                rows={4}
                className={adminTextarea}
                value={faqForm.answer}
                onChange={(e) => setFaqForm((f) => ({ ...f, answer: e.target.value }))}
                required
              />
            </Field>
            <div className="flex gap-2">
              <button type="submit" className={adminBtn} disabled={saveFaqMut.isPending}>
                Save
              </button>
              {editingFaq && (
                <button
                  type="button"
                  className={adminBtnOutline}
                  onClick={() => {
                    setEditingFaq(null);
                    setFaqForm({ group: "General", question: "", answer: "" });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {tab === "policies" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,1fr)]">
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Published policies
            </p>
            {legalQ.isLoading ? (
              <p className="font-mono text-xs text-muted-foreground">Loading…</p>
            ) : (
              (legalQ.data?.docs || []).map((d) => (
                <div key={d.slug} className="border border-border p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    /legal/{d.slug}
                    {!d.isPublished && " · draft"}
                  </p>
                  <p className="mt-1 font-medium">{d.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.summary}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className={adminBtnGhost}
                      onClick={() => {
                        setEditingLegal(d.slug);
                        setLegalForm({
                          slug: d.slug,
                          title: d.title,
                          summary: d.summary || "",
                          contentHtml: d.contentHtml || "<p></p>",
                          sortOrder: d.sortOrder ?? 0,
                          isPublished: d.isPublished !== false,
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={adminBtnGhost}
                      onClick={() => {
                        if (confirm(`Delete ${d.title}?`)) delLegalMut.mutate(d.slug);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <form
            className="space-y-3 border border-border p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!legalForm.title.trim()) {
                toast.error("Title is required");
                return;
              }
              if (!editingLegal && !legalForm.slug.trim()) {
                toast.error("Slug is required");
                return;
              }
              saveLegalMut.mutate();
            }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.18em]">
              {editingLegal ? `Edit ${editingLegal}` : "New policy"}
            </p>
            {!editingLegal && (
              <Field label="Slug (URL)">
                <input
                  className={adminField}
                  placeholder="privacy"
                  value={legalForm.slug}
                  onChange={(e) =>
                    setLegalForm((f) => ({
                      ...f,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                    }))
                  }
                  required
                />
              </Field>
            )}
            <Field label="Title">
              <input
                className={adminField}
                value={legalForm.title}
                onChange={(e) => setLegalForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </Field>
            <Field label="Summary">
              <input
                className={adminField}
                value={legalForm.summary || ""}
                onChange={(e) => setLegalForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </Field>
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Content (rich text)
              </p>
              <RichEditor
                value={legalForm.contentHtml || ""}
                onChange={(html) => setLegalForm((f) => ({ ...f, contentHtml: html }))}
              />
            </div>
            <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
              <input
                type="checkbox"
                checked={legalForm.isPublished !== false}
                onChange={(e) => setLegalForm((f) => ({ ...f, isPublished: e.target.checked }))}
              />
              Published
            </label>
            <div className="flex gap-2">
              <button type="submit" className={adminBtn} disabled={saveLegalMut.isPending}>
                {saveLegalMut.isPending ? "Saving…" : "Save policy"}
              </button>
              {editingLegal && (
                <button
                  type="button"
                  className={adminBtnOutline}
                  onClick={() => {
                    setEditingLegal(null);
                    setLegalForm({
                      slug: "",
                      title: "",
                      summary: "",
                      contentHtml: "<p></p>",
                      isPublished: true,
                      sortOrder: 0,
                    });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
