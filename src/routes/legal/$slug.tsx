import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Eyebrow } from "@/components/site/focus";
import { getLegal, legalDocs, type LegalDoc } from "@/data/legal";

export const Route = createFileRoute("/legal/$slug")({
  loader: ({ params }) => {
    const doc = getLegal(params.slug);
    if (!doc) throw notFound();
    return { doc };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Policy not found — Aperture" }, { name: "robots", content: "noindex" }] };
    }
    const d = loaderData.doc;
    return {
      meta: [
        { title: `${d.title} — Aperture` },
        { name: "description", content: d.summary },
        { property: "og:title", content: `${d.title} — Aperture` },
        { property: "og:description", content: d.summary },
      ],
    };
  },
  component: LegalPage,
});

function LegalPage() {
  const { doc } = Route.useLoaderData() as { doc: LegalDoc };

  return (
    <div className="mx-auto grid max-w-[1100px] gap-10 px-4 py-12 md:grid-cols-[220px_minmax(0,1fr)] md:py-20">
      <aside className="md:sticky md:top-28 md:self-start">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">Policies</p>
        <nav className="no-scrollbar mt-3 flex gap-2 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
          {legalDocs.map((d) => (
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
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] opacity-60">
          Contents
        </p>
        <ul className="mt-2 space-y-1">
          {doc.sections.map((s) => (
            <li key={s.heading}>
              <a href={`#${slugify(s.heading)}`} className="font-mono text-[11px] text-muted-foreground">
                {s.heading}
              </a>
            </li>
          ))}
        </ul>
      </aside>

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

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}