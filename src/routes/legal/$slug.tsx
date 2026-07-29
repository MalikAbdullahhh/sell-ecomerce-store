import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eyebrow } from "@/components/site/focus";
import { LegalPageSkeleton } from "@/components/site/skeletons";
import { cmsApi, type LegalDocApi } from "@/lib/api";

export const Route = createFileRoute("/legal/$slug")({
  loader: async ({ params }) => {
    try {
      const { doc } = await cmsApi.legal(params.slug);
      return { doc };
    } catch {
      throw notFound();
    }
  },
  pendingComponent: () => <LegalPageSkeleton />,
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Policy not found — Aperture" }, { name: "robots", content: "noindex" }],
      };
    }
    const d = loaderData.doc;
    return {
      meta: [
        { title: `${d.title} — Aperture` },
        { name: "description", content: d.summary || "" },
        { property: "og:title", content: `${d.title} — Aperture` },
        { property: "og:description", content: d.summary || "" },
      ],
    };
  },
  component: LegalPage,
});

function LegalPage() {
  const { doc } = Route.useLoaderData() as { doc: LegalDocApi };
  const [nav, setNav] = useState<{ slug: string; title: string }[]>([]);
  const [navLoading, setNavLoading] = useState(true);

  useEffect(() => {
    cmsApi
      .legalList()
      .then((res) => {
        setNav((res.docs || []).map((d) => ({ slug: d.slug, title: d.title })));
      })
      .catch(() => setNav([]))
      .finally(() => setNavLoading(false));
  }, []);

  const updated = doc.updatedAt
    ? new Date(doc.updatedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="mx-auto grid max-w-[1100px] gap-10 px-4 py-12 md:grid-cols-[220px_minmax(0,1fr)] md:py-20">
      {navLoading ? (
        <aside className="hidden space-y-2 md:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-full animate-pulse rounded-sm bg-muted" />
          ))}
        </aside>
      ) : <LegalNav items={nav} />}
      <article>
        {updated && <Eyebrow>Updated {updated}</Eyebrow>}
        <h1 className="mt-2 text-4xl md:text-5xl">{doc.title}</h1>
        {doc.summary && <p className="mt-4 max-w-xl text-muted-foreground">{doc.summary}</p>}
        <div
          className="legal-prose mt-10 max-w-2xl space-y-4 text-muted-foreground [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed [&_ul]:space-y-2"
          dangerouslySetInnerHTML={{ __html: doc.contentHtml || "" }}
        />
      </article>
    </div>
  );
}

function LegalNav({ items }: { items: { slug: string; title: string }[] }) {
  if (!items.length) return null;
  return (
    <aside className="md:sticky md:top-28 md:self-start">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">Policies</p>
      <nav className="no-scrollbar mt-3 flex gap-2 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
        {items.map((d) => (
          <Link
            key={d.slug}
            to="/legal/$slug"
            params={{ slug: d.slug }}
            className="shrink-0 border-b border-transparent py-2 font-mono text-[11px] uppercase tracking-[0.16em] data-[status=active]:border-foreground"
          >
            {d.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
