import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CmsIcon } from "@/components/site/cms-icon";
import { Eyebrow } from "@/components/site/focus";
import { usePageContent } from "@/lib/page-content";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Aperture — Replies Within One Working Day" },
      {
        name: "description",
        content: "Reach the Aperture team by email or phone, Monday to Friday 09:00–17:30 CET.",
      },
      { property: "og:title", content: "Contact Aperture" },
      {
        property: "og:description",
        content: "Email, phone and workshop address for Aperture support.",
      },
    ],
  }),
  component: Contact,
});

const field =
  "h-12 w-full border border-border bg-transparent px-3 font-mono text-sm outline-none focus:border-foreground";

function Contact() {
  const { section } = usePageContent("contact");
  const intro = section<{ eyebrow: string; title: string }>("intro");
  const form = section<{
    namePlaceholder: string;
    emailPlaceholder: string;
    orderPlaceholder: string;
    messagePlaceholder: string;
    buttonLabel: string;
    successMessage: string;
  }>("form");
  const cards = section<{
    visible: boolean;
    items: { icon: string; label: string; value: string }[];
  }>("cards");

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-10 md:py-20">
      <Eyebrow>{intro.eyebrow}</Eyebrow>
      <h1 className="mt-2 max-w-2xl text-4xl md:text-6xl">{intro.title}</h1>

      <div className="mt-12 grid gap-10 md:grid-cols-[minmax(0,1fr)_320px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast(form.successMessage);
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <input
            required
            className={field}
            placeholder={form.namePlaceholder}
            autoComplete="name"
          />
          <input
            required
            type="email"
            inputMode="email"
            className={field}
            placeholder={form.emailPlaceholder}
            autoComplete="email"
          />
          <input className={`${field} sm:col-span-2`} placeholder={form.orderPlaceholder} />
          <textarea
            required
            rows={6}
            placeholder={form.messagePlaceholder}
            className="w-full border border-border bg-transparent p-3 font-mono text-sm outline-none focus:border-foreground sm:col-span-2"
          />
          <button className="h-12 bg-foreground px-8 font-mono text-xs uppercase tracking-[0.22em] text-background sm:col-span-2 sm:justify-self-start">
            {form.buttonLabel}
          </button>
        </form>

        {cards.visible !== false && (
          <aside className="space-y-3">
            {(cards.items || []).map((item, i) => (
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
