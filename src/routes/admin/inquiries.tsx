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
import { adminApi, type ContactInquiryDoc } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/inquiries")({
  component: AdminInquiries,
  head: () => ({ meta: [{ title: "Inquiries — Aperture Admin" }] }),
});

const STATUSES: ContactInquiryDoc["status"][] = ["new", "read", "replied", "archived"];

function AdminInquiries() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selected, setSelected] = useState<ContactInquiryDoc | null>(null);
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "inquiries", statusFilter],
    queryFn: () => adminApi.contactInquiries(statusFilter ? { status: statusFilter } : undefined),
  });

  const filtered = useMemo(() => {
    const list = data?.inquiries || [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((i) =>
      [i.name, i.email, i.phone, i.orderNumber, i.message, i.status]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [data?.inquiries, q]);

  const updateMut = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<ContactInquiryDoc>;
    }) => adminApi.updateContactInquiry(id, body),
    onSuccess: (res) => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      qc.invalidateQueries({ queryKey: ["admin-unread-inquiries"] });
      setSelected(res.inquiry);
      setNote(res.inquiry.adminNote || "");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteContactInquiry(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      qc.invalidateQueries({ queryKey: ["admin-unread-inquiries"] });
      setSelected(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openInquiry(i: ContactInquiryDoc) {
    setSelected(i);
    setNote(i.adminNote || "");
    if (i.status === "new") {
      updateMut.mutate({ id: i._id, body: { status: "read" } });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Contact form
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em]">Inquiries</h1>
        </div>
        {(data?.unreadCount ?? 0) > 0 ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
            {data!.unreadCount} new
          </p>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          className={adminField}
          placeholder="Search name, email, phone, message…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={adminField}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        Showing {filtered.length}
        {(data?.inquiries || []).length !== filtered.length
          ? ` of ${(data?.inquiries || []).length}`
          : ""}{" "}
        inquiries
      </p>

      {isLoading ? (
        <p className="font-mono text-xs text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((i) => (
            <button
              key={i._id}
              type="button"
              onClick={() => openInquiry(i)}
              className={cn(
                "flex w-full flex-wrap items-start justify-between gap-3 border border-border p-4 text-left transition-colors hover:bg-mist/40",
                i.status === "new" && "border-primary/40 bg-primary/5",
                selected?._id === i._id && "ring-1 ring-foreground",
              )}
            >
              <div className="min-w-0">
                <p className="font-medium">{i.name}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {[i.email, i.phone].filter(Boolean).join(" · ") || "No contact detail"}
                  {i.orderNumber ? ` · Order ${i.orderNumber}` : ""}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{i.message}</p>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={cn(
                    "inline-block font-mono text-[10px] uppercase tracking-[0.14em]",
                    i.status === "new" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {i.status}
                </span>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {(i.createdAt || "").slice(0, 10)}
                </p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="font-mono text-xs text-muted-foreground">No inquiries yet</p>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-foreground/40">
          <div className="flex h-full w-full max-w-md flex-col border-l border-border bg-background">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">Inquiry</h2>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center"
                onClick={() => setSelected(null)}
              >
                <X width={18} height={18} />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto p-4">
              <div>
                <p className="text-lg font-medium">{selected.name}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {(selected.createdAt || "").slice(0, 19).replace("T", " ")}
                </p>
              </div>
              <dl className="space-y-2 font-mono text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="text-right">
                    {selected.email ? (
                      <a className="underline" href={`mailto:${selected.email}`}>
                        {selected.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="text-right">
                    {selected.phone ? (
                      <a className="underline" href={`tel:${selected.phone}`}>
                        {selected.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Order</dt>
                  <dd className="text-right">{selected.orderNumber || "—"}</dd>
                </div>
              </dl>
              <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Message
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{selected.message}</p>
              </div>
              <Field label="Status">
                <select
                  className={adminField}
                  value={selected.status}
                  onChange={(e) =>
                    updateMut.mutate({
                      id: selected._id,
                      body: { status: e.target.value as ContactInquiryDoc["status"] },
                    })
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Admin note">
                <textarea
                  rows={3}
                  className={adminTextarea}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Internal notes…"
                />
              </Field>
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  className={adminBtn}
                  disabled={updateMut.isPending}
                  onClick={() =>
                    updateMut.mutate({ id: selected._id, body: { adminNote: note } })
                  }
                >
                  Save note
                </button>
                <button
                  type="button"
                  className={adminBtnOutline}
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className={adminBtnGhost}
                  onClick={() => {
                    if (confirm("Delete this inquiry?")) deleteMut.mutate(selected._id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
