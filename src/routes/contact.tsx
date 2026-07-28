import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CmsIcon } from "@/components/site/cms-icon";
import { Eyebrow } from "@/components/site/focus";
import { PageSkeleton } from "@/components/site/skeletons";
import { contactApi } from "@/lib/api";
import { usePageContent } from "@/lib/page-content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Genz Gadgets PK" },
      {
        name: "description",
        content: "Get in touch with Genz Gadgets PK support.",
      },
      { property: "og:title", content: "Contact — Genz Gadgets PK" },
      {
        property: "og:description",
        content: "Get in touch with Genz Gadgets PK support.",
      },
    ],
  }),
  component: Contact,
});

const field =
  "h-12 w-full border border-border bg-transparent px-3 font-mono text-sm outline-none focus:border-foreground";

function Contact() {
  const { section, loaded } = usePageContent("contact");
  const intro = section<{ eyebrow: string; title: string }>("intro");
  const form = section<{
    namePlaceholder: string;
    emailPlaceholder: string;
    phonePlaceholder: string;
    orderPlaceholder: string;
    messagePlaceholder: string;
    buttonLabel: string;
    successMessage: string;
  }>("form");
  const cards = section<{
    visible: boolean;
    items: { icon: string; label: string; value: string }[];
  }>("cards");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState(false);

  const submitMut = useMutation({
    mutationFn: () =>
      contactApi.submit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        orderNumber: orderNumber.trim(),
        message: message.trim(),
      }),
    onSuccess: () => {
      toast.success(form.successMessage || "Message sent.");
      setName("");
      setEmail("");
      setPhone("");
      setOrderNumber("");
      setMessage("");
      setTouched(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const emailTrim = email.trim();
  const phoneTrim = phone.trim();
  const hasEmail = Boolean(emailTrim);
  const hasPhone = Boolean(phoneTrim);
  const contactMissing = touched && !hasEmail && !hasPhone;

  if (!loaded) return <PageSkeleton rows={2} />;

  const detailItems = (cards.items || []).filter((i) => i.label?.trim() || i.value?.trim());

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-10 md:py-20">
      {intro.eyebrow ? <Eyebrow>{intro.eyebrow}</Eyebrow> : null}
      <h1 className="mt-2 max-w-2xl text-4xl md:text-6xl">{intro.title || "Contact"}</h1>

      <div className="mt-12 grid gap-10 md:grid-cols-[minmax(0,1fr)_320px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (!name.trim()) {
              toast.error("Name is required");
              return;
            }
            if (!message.trim()) {
              toast.error("Message is required");
              return;
            }
            if (!emailTrim && !phoneTrim) {
              toast.error("Provide an email or phone number");
              return;
            }
            submitMut.mutate();
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <input
            required
            className={field}
            placeholder={form.namePlaceholder || "Name"}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className={field}
            placeholder={form.orderPlaceholder || "Order number (optional)"}
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
          <div className="space-y-1">
            <input
              type="email"
              inputMode="email"
              className={cn(field, contactMissing && "border-destructive")}
              placeholder={form.emailPlaceholder || "Email"}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={contactMissing}
            />
          </div>
          <div className="space-y-1">
            <input
              type="tel"
              inputMode="tel"
              className={cn(field, contactMissing && "border-destructive")}
              placeholder={form.phonePlaceholder || "Phone"}
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={contactMissing}
            />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:col-span-2">
            Email or phone required — you can provide both
          </p>
          {contactMissing ? (
            <p className="font-mono text-[11px] text-destructive sm:col-span-2">
              Enter at least an email or a phone number
            </p>
          ) : null}
          <textarea
            required
            rows={6}
            placeholder={form.messagePlaceholder || "What can we help with?"}
            className="w-full border border-border bg-transparent p-3 font-mono text-sm outline-none focus:border-foreground sm:col-span-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={submitMut.isPending}
            className="glass-sweep h-12 bg-foreground px-8 font-mono text-xs uppercase tracking-[0.22em] text-background disabled:opacity-50 sm:col-span-2 sm:justify-self-start"
          >
            {submitMut.isPending ? "Sending…" : form.buttonLabel || "Send message"}
          </button>
        </form>

        {cards.visible !== false && detailItems.length > 0 && (
          <aside className="space-y-3">
            {detailItems.map((item, i) => (
              <div
                key={`${item.label}-${i}`}
                className="flex items-start gap-3 border border-border p-4"
              >
                <CmsIcon name={item.icon} size={17} className="mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm">{item.value}</p>
                </div>
              </div>
            ))}
          </aside>
        )}
      </div>
    </div>
  );
}
