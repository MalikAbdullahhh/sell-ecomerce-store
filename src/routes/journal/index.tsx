import { createFileRoute, Link } from "@tanstack/react-router";
import { Eyebrow, FocusIn } from "@/components/site/focus";
import { posts } from "@/data/catalog";

export const Route = createFileRoute("/journal/")({
  head: () => ({
    meta: [
      { title: "Journal — Notes from the Aperture Bench" },
      { name: "description", content: "Process, engineering and field notes from the Aperture workshop in Rotterdam." },
      { property: "og:title", content: "Journal — Notes from the Aperture Bench" },
      { property: "og:description", content: "Process, engineering and field notes from the workshop." },
    ],
  }),
  component: JournalIndex,
});

function JournalIndex() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-10 md:py-20">
      <Eyebrow>{posts.length} entries</Eyebrow>
      <h1 className="mt-2 text-4xl md:text-6xl">Journal</h1>

      <div className="mt-12 grid gap-x-6 gap-y-12 md:grid-cols-3">
        {posts.map((p) => (
          <FocusIn key={p.slug}>
            <Link to="/journal/$slug" params={{ slug: p.slug }} className="crosshair group block">
              <div className="aspect-[4/3] overflow-hidden border border-border">
                <img
                  src={p.image}
                  alt={p.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {p.category} · {p.readTime}
              </p>
              <h2 className="mt-2 text-xl">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
            </Link>
          </FocusIn>
        ))}
      </div>
    </div>
  );
}