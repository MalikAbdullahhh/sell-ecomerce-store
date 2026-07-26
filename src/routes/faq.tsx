import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Eyebrow } from "@/components/site/focus";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faqs } from "@/data/catalog";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Orders, Returns, Payments | Aperture" },
      { name: "description", content: "Answers on delivery times, Cash on Delivery, the 30-day return window, warranty and spare parts." },
      { property: "og:title", content: "FAQ — Orders, Returns, Payments | Aperture" },
      { property: "og:description", content: "Answers on delivery, returns, payments and warranty." },
    ],
  }),
  component: Faq,
});

function Faq() {
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return faqs;
    return faqs
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => i.q.toLowerCase().includes(term) || i.a.toLowerCase().includes(term)),
      }))
      .filter((g) => g.items.length);
  }, [q]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
      <Eyebrow>Support</Eyebrow>
      <h1 className="mt-2 text-4xl md:text-5xl">Frequently asked</h1>

      <div className="mt-8 flex items-center gap-3 border border-border px-3">
        <Search width={16} height={16} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the FAQ"
          className="h-12 w-full bg-transparent font-mono text-sm outline-none"
        />
      </div>

      {groups.length === 0 ? (
        <p className="mt-10 font-mono text-sm text-muted-foreground">
          No answers match that. Try "delivery", "refund" or "warranty".
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.group} className="mt-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">{g.group}</p>
            <Accordion type="single" collapsible className="mt-3">
              {g.items.map((item) => (
                <AccordionItem key={item.q} value={item.q}>
                  <AccordionTrigger className="text-left text-[15px]">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))
      )}
    </div>
  );
}