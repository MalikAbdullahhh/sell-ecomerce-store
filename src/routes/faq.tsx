import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Eyebrow } from "@/components/site/focus";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FaqPageSkeleton } from "@/components/site/skeletons";
import { cmsApi } from "@/lib/api";
import { usePageContent } from "@/lib/page-content";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Orders, Returns, Payments | Aperture" },
      {
        name: "description",
        content:
          "Answers on delivery times, Cash on Delivery, the 30-day return window, warranty and spare parts.",
      },
      { property: "og:title", content: "FAQ — Orders, Returns, Payments | Aperture" },
      {
        property: "og:description",
        content: "Answers on delivery, returns, payments and warranty.",
      },
    ],
  }),
  component: Faq,
});

type FaqGroup = { group: string; items: { q: string; a: string }[] };

function Faq() {
  const [q, setQ] = useState("");
  const [source, setSource] = useState<FaqGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { section } = usePageContent("faq");
  const header = section<{
    eyebrow: string;
    title: string;
    searchPlaceholder: string;
    emptyText: string;
  }>("header");

  useEffect(() => {
    cmsApi
      .faqs()
      .then((d) => setSource(d.faqs || []))
      .catch(() => setSource([]))
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return source;
    return source
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) => i.q.toLowerCase().includes(term) || i.a.toLowerCase().includes(term),
        ),
      }))
      .filter((g) => g.items.length);
  }, [q, source]);

  if (loading) return <FaqPageSkeleton />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
      <Eyebrow>{header.eyebrow}</Eyebrow>
      <h1 className="mt-2 text-4xl md:text-5xl">{header.title}</h1>

      <div className="mt-8 flex items-center gap-3 border border-border px-3">
        <Search width={16} height={16} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={header.searchPlaceholder}
          className="h-12 flex-1 bg-transparent font-mono text-sm outline-none"
        />
      </div>

      {groups.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">{header.emptyText}</p>
      ) : (
        <div className="mt-10 space-y-8">
          {groups.map((g) => (
            <div key={g.group}>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {g.group}
              </p>
              <Accordion type="single" collapsible className="mt-3">
                {g.items.map((item, i) => (
                  <AccordionItem key={`${g.group}-${i}`} value={`${g.group}-${i}`}>
                    <AccordionTrigger className="text-left text-base">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
