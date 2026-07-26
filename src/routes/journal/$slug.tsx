import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Brackets, Eyebrow } from "@/components/site/focus";
import { Rail } from "@/components/site/rail";
import { getPost, posts, type Post } from "@/data/catalog";

export const Route = createFileRoute("/journal/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Article not found — Aperture" }, { name: "robots", content: "noindex" }],
      };
    }
    const p = loaderData.post;
    return {
      meta: [
        { title: `${p.title} — Aperture Journal` },
        { name: "description", content: p.excerpt },
        { property: "og:title", content: p.title },
        { property: "og:description", content: p.excerpt },
        { property: "og:image", content: p.image },
        { name: "twitter:image", content: p.image },
      ],
    };
  },
  component: PostPage,
});

function PostPage() {
  const { post } = Route.useLoaderData() as { post: Post };
  const more = posts.filter((p) => p.slug !== post.slug).slice(0, 4);

  return (
    <article>
      <div className="mx-auto max-w-[720px] px-4 py-12 md:py-20">
        <Eyebrow>
          {post.category} · {post.readTime} · {post.date}
        </Eyebrow>
        <h1 className="mt-3 text-4xl leading-[1.05] md:text-5xl">{post.title}</h1>
      </div>
      <div className="crosshair relative mx-auto aspect-[16/9] max-w-[1100px] overflow-hidden border border-border">
        <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
        <Brackets size={24} className="text-foreground" />
      </div>
      <div className="mx-auto max-w-[720px] space-y-5 px-4 py-12 text-[17px] leading-relaxed text-muted-foreground">
        {post.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <section className="mx-auto max-w-[1440px] border-t border-border px-4 py-14 md:px-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">
          More from the Journal
        </p>
        <div className="mt-6">
          <Rail>
            {more.map((p) => (
              <Link
                key={p.slug}
                to="/journal/$slug"
                params={{ slug: p.slug }}
                className="w-[70vw] shrink-0 snap-start sm:w-[44vw] md:w-[300px]"
              >
                <div className="aspect-[4/3] overflow-hidden border border-border">
                  <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                </div>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {p.category} · {p.readTime}
                </p>
                <p className="mt-1 text-base font-medium">{p.title}</p>
              </Link>
            ))}
          </Rail>
        </div>
      </section>
    </article>
  );
}
