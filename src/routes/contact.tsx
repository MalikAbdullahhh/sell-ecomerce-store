import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow } from "@/components/site/focus";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Aperture — Replies Within One Working Day" },
      { name: "description", content: "Reach the Aperture team by email or phone, Monday to Friday 09:00–17:30 CET." },
      { property: "og:title", content: "Contact Aperture" },
      { property: "og:description", content: "Email, phone and workshop address for Aperture support." },
    ],
  }),
  component: Contact,
});

const field = "h-12 w-full border border-border bg-transparent px-3 font-mono text-sm outline-none focus:border-foreground";

function Contact() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-10 md:py-20">
      <Eyebrow>Support · Mon–Fri 09:00–17:30 CET</Eyebrow>
      <h1 className="mt-2 max-w-2xl text-4xl md:text-6xl">Every message gets a reply within one working day.</h1>

      <div className="mt-12 grid gap-10 md:grid-cols-[minmax(0,1fr)_320px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast("Message sent — expect a reply within one working day.");
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <input required className={field} placeholder="Name" autoComplete="name" />
          <input required type="email" inputMode="email" className={field} placeholder="Email" autoComplete="email" />
          <input className={`${field} sm:col-span-2`} placeholder="Order number (optional)" />
          <textarea
            required
            rows={6}
            placeholder="What can we help with?"
            className="w-full border border-border bg-transparent p-3 font-mono text-sm outline-none focus:border-foreground sm:col-span-2"
          />
          <button className="h-12 bg-foreground px-8 font-mono text-xs uppercase tracking-[0.22em] text-background sm:col-span-2 sm:justify-self-start">
            Send message
          </button>
        </form>

        <aside className="space-y-3">
          {[
            { icon: Mail, t: "support@aperture.tech", s: "Email" },
            { icon: Phone, t: "+31 10 555 0142", s: "Phone" },
            { icon: Clock, t: "Mon–Fri, 09:00–17:30 CET", s: "Hours" },
            { icon: MapPin, t: "Scheepsbouwkade 14, Rotterdam", s: "Workshop" },
          ].map(({ icon: Icon, t, s }) => (
            <div key={s} className="flex items-start gap-3 border border-border p-4">
              <Icon width={17} height={17} strokeWidth={1.4} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{s}</p>
                <p className="mt-1 text-sm">{t}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}