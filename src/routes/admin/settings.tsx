import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminBtn, adminField, Field } from "@/components/admin/field";
import { SingleUploader } from "@/components/admin/uploader";
import { adminApi, type ExtraCharge, type SiteSettings } from "@/lib/api";
import { DEFAULT_BRAND_NAME, DEFAULT_TAGLINE, notifySiteSettingsUpdated } from "@/lib/brand";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
  head: () => ({ meta: [{ title: "Settings — Aperture Admin" }] }),
});

const emptySettings = (): SiteSettings => ({
  brandName: DEFAULT_BRAND_NAME,
  tagline: DEFAULT_TAGLINE,
  announcement: "",
  announcementEmojis: ["🎉", "😊", "✨"],
  announcementSpeed: 28,
  contact: { email: "", phone: "", whatsapp: "", hours: "", address: "" },
  social: { instagram: "", facebook: "", twitter: "", youtube: "", tiktok: "" },
  payment: {
    codEnabled: true,
    onlineEnabled: true,
    online: {
      accountName: "",
      accountNumber: "",
      bankName: "",
      iban: "",
      instructions: "",
      qrImage: "",
    },
  },
  shipping: { freeThreshold: 0, flatFee: 0, giftFee: 0, currency: "PKR" },
  extraCharges: [],
  help: { callLabel: "", whatsappLabel: "", helpText: "" },
  newsletter: {
    enabled: true,
    eyebrow: "10% off your first order",
    headline: "One email a month. Measurements, not marketing.",
    buttonLabel: "Subscribe",
    successMessage: "You're on the list.",
  },
  testimonialsSection: {
    eyebrow: "Verified purchasers",
    title: "What owners report",
  },
});

const EMOJI_OPTIONS = [
  "🎉",
  "😊",
  "✨",
  "🔥",
  "❤️",
  "🥳",
  "👏",
  "🛍️",
  "🚚",
  "⭐",
  "💯",
  "🎁",
  "😎",
  "🚀",
  "💫",
  "🙌",
];

function AdminSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState<SiteSettings>(emptySettings());

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "site"],
    queryFn: () => adminApi.site(),
  });

  useEffect(() => {
    if (!data?.settings) return;
    setForm({
      ...emptySettings(),
      ...data.settings,
      announcementEmojis: Array.isArray(data.settings.announcementEmojis)
        ? data.settings.announcementEmojis
        : ["🎉", "😊", "✨"],
      announcementSpeed: data.settings.announcementSpeed ?? 28,
      contact: { ...emptySettings().contact, ...data.settings.contact },
      social: { ...emptySettings().social, ...data.settings.social },
      payment: {
        ...emptySettings().payment,
        ...data.settings.payment,
        online: { ...emptySettings().payment.online, ...data.settings.payment?.online },
      },
      shipping: { ...emptySettings().shipping, ...data.settings.shipping },
      extraCharges: data.settings.extraCharges || [],
      help: { ...emptySettings().help, ...data.settings.help },
    });
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () =>
      adminApi.saveSite({
        ...form,
        brandName: DEFAULT_BRAND_NAME,
      }),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["admin", "site"] });
      notifySiteSettingsUpdated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <p className="font-mono text-xs text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Store
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em]">Settings</h1>
      </div>

      <form
        className="max-w-3xl space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          saveMut.mutate();
        }}
      >
        <section className="space-y-3 border border-border p-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">Brand</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Brand name">
              <input
                className={adminField}
                value={DEFAULT_BRAND_NAME}
                readOnly
                title="Brand name is fixed in the theme for now"
              />
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                Fixed site-wide — no load from settings
              </p>
            </Field>
            <Field label="Tagline">
              <input
                className={adminField}
                value={form.tagline}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Announcement marquee text">
            <input
              className={adminField}
              value={form.announcement}
              onChange={(e) => setForm((f) => ({ ...f, announcement: e.target.value }))}
              placeholder="Free shipping over Rs 20,000 · Cash on Delivery available"
            />
          </Field>
          <Field label="Marquee speed (seconds per loop)">
            <input
              type="number"
              min={10}
              max={90}
              className={adminField}
              value={form.announcementSpeed ?? 28}
              onChange={(e) =>
                setForm((f) => ({ ...f, announcementSpeed: Number(e.target.value) || 28 }))
              }
            />
          </Field>
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Animated emojis (click to toggle)
            </p>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => {
                const active = (form.announcementEmojis || []).includes(emoji);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() =>
                      setForm((f) => {
                        const current = f.announcementEmojis || [];
                        return {
                          ...f,
                          announcementEmojis: active
                            ? current.filter((e) => e !== emoji)
                            : [...current, emoji],
                        };
                      })
                    }
                    className={`grid h-11 w-11 place-items-center border text-lg transition-colors ${
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
            {(form.announcementEmojis || []).length > 0 && (
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                Selected: {(form.announcementEmojis || []).join(" ")}
              </p>
            )}
          </div>
        </section>

        <section className="space-y-3 border border-border p-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">Contact</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["email", "Email"],
                ["phone", "Phone"],
                ["whatsapp", "WhatsApp"],
                ["hours", "Hours"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  className={adminField}
                  value={form.contact[key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contact: { ...f.contact, [key]: e.target.value } }))
                  }
                />
              </Field>
            ))}
            <Field label="Address" className="sm:col-span-2">
              <input
                className={adminField}
                value={form.contact.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contact: { ...f.contact, address: e.target.value } }))
                }
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3 border border-border p-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">Social</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.keys(form.social).map((key) => (
              <Field key={key} label={key}>
                <input
                  className={adminField}
                  value={form.social[key] || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, social: { ...f.social, [key]: e.target.value } }))
                  }
                />
              </Field>
            ))}
          </div>
        </section>

        <section className="space-y-3 border border-border p-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">Payment</h2>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
              <input
                type="checkbox"
                checked={form.payment.codEnabled}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    payment: { ...f.payment, codEnabled: e.target.checked },
                  }))
                }
              />
              COD enabled
            </label>
            <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
              <input
                type="checkbox"
                checked={form.payment.onlineEnabled}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    payment: { ...f.payment, onlineEnabled: e.target.checked },
                  }))
                }
              />
              Online enabled
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["accountName", "Account name"],
                ["accountNumber", "Account number"],
                ["bankName", "Bank name"],
                ["iban", "IBAN"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  className={adminField}
                  value={form.payment.online[key]}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      payment: {
                        ...f.payment,
                        online: { ...f.payment.online, [key]: e.target.value },
                      },
                    }))
                  }
                />
              </Field>
            ))}
            <Field label="Instructions" className="sm:col-span-2">
              <input
                className={adminField}
                value={form.payment.online.instructions}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    payment: {
                      ...f.payment,
                      online: { ...f.payment.online, instructions: e.target.value },
                    },
                  }))
                }
              />
            </Field>
            <Field label="QR image" className="sm:col-span-2">
              <SingleUploader
                value={form.payment.online.qrImage}
                onChange={(qrImage) =>
                  setForm((f) => ({
                    ...f,
                    payment: { ...f.payment, online: { ...f.payment.online, qrImage } },
                  }))
                }
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3 border border-border p-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">Shipping (PKR)</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Free threshold">
              <input
                type="number"
                className={adminField}
                value={form.shipping.freeThreshold}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    shipping: { ...f.shipping, freeThreshold: Number(e.target.value) || 0 },
                  }))
                }
              />
            </Field>
            <Field label="Flat fee">
              <input
                type="number"
                className={adminField}
                value={form.shipping.flatFee}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    shipping: { ...f.shipping, flatFee: Number(e.target.value) || 0 },
                  }))
                }
              />
            </Field>
            <Field label="Gift fee">
              <input
                type="number"
                className={adminField}
                value={form.shipping.giftFee}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    shipping: { ...f.shipping, giftFee: Number(e.target.value) || 0 },
                  }))
                }
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3 border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">
                Extra charges (tax, delivery…)
              </h2>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                Key/value charges applied to every checkout in real time.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  extraCharges: [
                    ...(f.extraCharges || []),
                    { label: "", type: "flat", value: 0, enabled: true },
                  ],
                }))
              }
              className="border border-foreground px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
            >
              + Add charge
            </button>
          </div>

          {(form.extraCharges || []).length === 0 && (
            <p className="font-mono text-[11px] text-muted-foreground">No extra charges yet.</p>
          )}

          <div className="space-y-2">
            {(form.extraCharges || []).map((charge, i) => {
              const update = (patch: Partial<ExtraCharge>) =>
                setForm((f) => ({
                  ...f,
                  extraCharges: (f.extraCharges || []).map((c, idx) =>
                    idx === i ? { ...c, ...patch } : c,
                  ),
                }));
              return (
                <div
                  key={i}
                  className="grid grid-cols-[minmax(0,1fr)_110px_110px_auto_auto] items-center gap-2"
                >
                  <input
                    className={adminField}
                    placeholder="Label (e.g. Tax, Delivery)"
                    value={charge.label}
                    onChange={(e) => update({ label: e.target.value })}
                  />
                  <select
                    className={adminField}
                    value={charge.type}
                    onChange={(e) => update({ type: e.target.value as ExtraCharge["type"] })}
                  >
                    <option value="flat">Flat (Rs)</option>
                    <option value="percent">Percent (%)</option>
                  </select>
                  <input
                    type="number"
                    className={adminField}
                    placeholder="Value"
                    value={charge.value}
                    onChange={(e) => update({ value: Number(e.target.value) || 0 })}
                  />
                  <label className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em]">
                    <input
                      type="checkbox"
                      checked={charge.enabled !== false}
                      onChange={(e) => update({ enabled: e.target.checked })}
                    />
                    On
                  </label>
                  <button
                    type="button"
                    aria-label="Remove charge"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        extraCharges: (f.extraCharges || []).filter((_, idx) => idx !== i),
                      }))
                    }
                    className="grid h-9 w-9 place-items-center border border-border text-muted-foreground"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3 border border-border p-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">Help text</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Call label">
              <input
                className={adminField}
                value={form.help.callLabel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, help: { ...f.help, callLabel: e.target.value } }))
                }
              />
            </Field>
            <Field label="WhatsApp label">
              <input
                className={adminField}
                value={form.help.whatsappLabel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, help: { ...f.help, whatsappLabel: e.target.value } }))
                }
              />
            </Field>
            <Field label="Help text" className="sm:col-span-2">
              <input
                className={adminField}
                value={form.help.helpText}
                onChange={(e) =>
                  setForm((f) => ({ ...f, help: { ...f.help, helpText: e.target.value } }))
                }
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3 border border-border p-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em]">
            Newsletter & testimonials
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Newsletter eyebrow">
              <input
                className={adminField}
                value={form.newsletter?.eyebrow || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    newsletter: {
                      enabled: f.newsletter?.enabled !== false,
                      headline: f.newsletter?.headline || "",
                      buttonLabel: f.newsletter?.buttonLabel || "Subscribe",
                      successMessage: f.newsletter?.successMessage || "",
                      eyebrow: e.target.value,
                    },
                  }))
                }
              />
            </Field>
            <Field label="Newsletter button">
              <input
                className={adminField}
                value={form.newsletter?.buttonLabel || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    newsletter: {
                      enabled: f.newsletter?.enabled !== false,
                      eyebrow: f.newsletter?.eyebrow || "",
                      headline: f.newsletter?.headline || "",
                      successMessage: f.newsletter?.successMessage || "",
                      buttonLabel: e.target.value,
                    },
                  }))
                }
              />
            </Field>
            <Field label="Newsletter headline" className="sm:col-span-2">
              <input
                className={adminField}
                value={form.newsletter?.headline || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    newsletter: {
                      enabled: f.newsletter?.enabled !== false,
                      eyebrow: f.newsletter?.eyebrow || "",
                      buttonLabel: f.newsletter?.buttonLabel || "Subscribe",
                      successMessage: f.newsletter?.successMessage || "",
                      headline: e.target.value,
                    },
                  }))
                }
              />
            </Field>
            <Field label="Testimonials eyebrow">
              <input
                className={adminField}
                value={form.testimonialsSection?.eyebrow || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    testimonialsSection: {
                      title: f.testimonialsSection?.title || "",
                      eyebrow: e.target.value,
                    },
                  }))
                }
              />
            </Field>
            <Field label="Testimonials title">
              <input
                className={adminField}
                value={form.testimonialsSection?.title || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    testimonialsSection: {
                      eyebrow: f.testimonialsSection?.eyebrow || "",
                      title: e.target.value,
                    },
                  }))
                }
              />
            </Field>
            <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] sm:col-span-2">
              <input
                type="checkbox"
                checked={form.newsletter?.enabled !== false}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    newsletter: {
                      enabled: e.target.checked,
                      eyebrow: f.newsletter?.eyebrow || "",
                      headline: f.newsletter?.headline || "",
                      buttonLabel: f.newsletter?.buttonLabel || "Subscribe",
                      successMessage: f.newsletter?.successMessage || "",
                    },
                  }))
                }
              />
              Newsletter section enabled
            </label>
          </div>
        </section>

        <button type="submit" className={adminBtn} disabled={saveMut.isPending}>
          {saveMut.isPending ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
