import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eyebrow } from "@/components/site/focus";
import { PageSkeleton } from "@/components/site/skeletons";
import { getLegal, legalDocs } from "@/data/legal";
import { cmsApi, type LegalDocApi } from "@/lib/api";

export const Route = createFileRoute("/legal/$slug")({
  loader: async ({ params }) => {
    try {
      const { doc } = await cmsApi.legal(params.slug);
      return { doc, fromApi: true as const };
    } catch {
      const fallback = getLegal(params.slug);
      if (!fallback) throw notFound();
      return { doc: fallback, fromApi: false as const };
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Policy not found — Aperture" }, { name: "robots", content: "noindex" }],
      };
    }
    const d = loaderData.doc;
    const title = "title" in d ? d.title : "";
    const summary = "summary" in d ? d.summary || "" : "";
    return {
      meta: [
        { title: `${title} — Aperture` },
        { name: "description", content: summary },
        { property: "og:title", content: `${title} — Aperture` },
        { property: "og:description", content: summary },
      ],
    };
  },
  component: LegalPage,
});

function LegalPage() {
  const data = Route.useLoaderData();
  const [nav, setNav] = useState<{ slug: string; title: string }[]>(
    legalDocs.map((d) => ({ slug: d.slug, title: d.title })),
  );

  useEffect(() => {
    cmsApi
      .legalList()
      .then((res) => {
        if (res.docs?.length) setNav(res.docs.map((d) => ({ slug: d.slug, title: d.title })));
      })
      .catch(() => {
        /* keep static nav */
      });
  }, []);

  if (data.fromApi) {
    const doc = data.doc as LegalDocApi;
    const updated = doc.updatedAt
      ? new Date(doc.updatedAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "";
    return (
      <div className="mx-auto grid max-w-[1100px] gap-10 px-4 py-12 md:grid-cols-[220px_minmax(0,1fr)] md:py-20">
        <LegalNav items={nav} />
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

  const doc = data.doc;
  return (
    <div className="mx-auto grid max-w-[1100px] gap-10 px-4 py-12 md:grid-cols-[220px_minmax(0,1fr)] md:py-20">
      <LegalNav items={nav} />
      <article>
        <Eyebrow>Updated {doc.updated}</Eyebrow>
        <h1 className="mt-2 text-4xl md:text-5xl">{doc.title}</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">{doc.summary}</p>
        <div className="mt-10 space-y-10">
          {doc.sections.map((s) => (
            <section key={s.heading} id={slugify(s.heading)} className="scroll-mt-28">
              <h2 className="text-xl">{s.heading}</h2>
              <div className="mt-3 space-y-3 text-muted-foreground">
                {s.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}

function LegalNav({ items }: { items: { slug: string; title: string }[] }) {
  if (!items.length) return <PageSkeleton rows={1} />;
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

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
