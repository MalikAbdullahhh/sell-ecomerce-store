import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { adminBtn, adminBtnGhost, adminField, adminLabel } from "@/components/admin/field";
import { RichEditor } from "@/components/admin/rich-editor";
import { AdminTableSkeleton } from "@/components/site/skeletons";
import { adminApi } from "@/lib/api";

export const Route = createFileRoute("/admin/newsletter")({
  component: AdminNewsletter,
  head: () => ({ meta: [{ title: "Newsletter — Aperture Admin" }] }),
});

function AdminNewsletter() {
  const qc = useQueryClient();
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("<p>Hello from Aperture.</p>");

  const subs = useQuery({
    queryKey: ["admin", "newsletter-subs"],
    queryFn: () => adminApi.newsletterSubscribers(),
  });
  const campaigns = useQuery({
    queryKey: ["admin", "newsletter-campaigns"],
    queryFn: () => adminApi.newsletterCampaigns(),
  });

  const sendMut = useMutation({
    mutationFn: () => adminApi.sendNewsletter({ subject, bodyHtml }),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ["admin", "newsletter-campaigns"] });
      setSubject("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteSubscriber(id),
    onSuccess: () => {
      toast.success("Subscriber removed");
      qc.invalidateQueries({ queryKey: ["admin", "newsletter-subs"] });
    },
  });

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Audience
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em]">Newsletter</h1>
      </div>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3 border border-border p-5">
          <h2 className="font-display text-xl">Compose & send</h2>
          <label className="block space-y-1">
            <span className={adminLabel}>Subject</span>
            <input
              className={adminField}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="March measurements"
            />
          </label>
          <div className="space-y-1">
            <span className={adminLabel}>Body</span>
            <RichEditor value={bodyHtml} onChange={setBodyHtml} />
          </div>
          <button
            type="button"
            className={adminBtn}
            disabled={sendMut.isPending || !subject.trim()}
            onClick={() => {
              if (!confirm(`Send to ${(subs.data?.subscribers || []).length} subscribers?`)) return;
              sendMut.mutate();
            }}
          >
            {sendMut.isPending ? "Sending…" : "Send to all subscribers"}
          </button>
          <p className="font-mono text-[10px] text-muted-foreground">
            Requires SMTP_USER / SMTP_PASS in backend/.env
          </p>
        </div>

        <div className="space-y-3 border border-border p-5">
          <h2 className="font-display text-xl">Recent campaigns</h2>
          {campaigns.isLoading ? (
            <AdminTableSkeleton rows={3} />
          ) : (
            <ul className="divide-y divide-border">
              {(campaigns.data?.campaigns || []).map((c) => (
                <li key={c._id} className="py-3">
                  <p className="text-sm font-medium">{c.subject}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {c.status} · {c.sentCount} sent ·{" "}
                    {c.createdAt ? new Date(c.createdAt).toLocaleString("en-PK") : ""}
                  </p>
                </li>
              ))}
              {(campaigns.data?.campaigns || []).length === 0 && (
                <li className="py-6 font-mono text-xs text-muted-foreground">No campaigns yet</li>
              )}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">
          Subscribers ({subs.data?.subscribers?.length || 0})
        </h2>
        {subs.isLoading ? (
          <AdminTableSkeleton />
        ) : (
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-border font-mono text-[10px] uppercase tracking-[0.16em]">
                <tr>
                  <th className="px-3 py-3 font-normal">Email</th>
                  <th className="px-3 py-3 font-normal">Name</th>
                  <th className="px-3 py-3 font-normal">Joined</th>
                  <th className="px-3 py-3 font-normal" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(subs.data?.subscribers || []).map((s) => (
                  <tr key={s._id}>
                    <td className="px-3 py-3 font-mono text-xs">{s.email}</td>
                    <td className="px-3 py-3">{s.name || "—"}</td>
                    <td className="px-3 py-3 font-mono text-[10px] text-muted-foreground">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-PK") : "—"}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        className={adminBtnGhost}
                        onClick={() => deleteMut.mutate(s._id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
