import { createFileRoute } from "@tanstack/react-router";
import { Brackets, Eyebrow, FocusIn } from "@/components/site/focus";
import { Section } from "@/components/site/rail";
import { PageSkeleton } from "@/components/site/skeletons";
import { mediaUrl } from "@/lib/api";
import { usePageContent } from "@/lib/page-content";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Genz Gadgets PK" },
      {
        name: "description",
        content: "Learn more about Genz Gadgets PK.",
      },
      { property: "og:title", content: "About — Genz Gadgets PK" },
      {
        property: "og:description",
        content: "Learn more about Genz Gadgets PK.",
      },
    ],
  }),
  component: About,
});

function About() {
  const { section, loaded } = usePageContent("about");
  const intro = section<{
    eyebrow: string;
    title: string;
    image: string;
    paragraphs: { text: string }[];
  }>("intro");
  const values = section<{
    visible: boolean;
    items: { number: string; title: string; body: string }[];
  }>("values");
  const team = section<{
    visible: boolean;
    eyebrow: string;
    title: string;
    photos: { image: string }[];
  }>("team");

  if (!loaded) return <PageSkeleton rows={3} />;

  const paragraphs = (intro.paragraphs || []).filter((p) => p.text?.trim());
  const valueItems = (values.items || []).filter((v) => v.title?.trim() || v.body?.trim());
  const photos = (team.photos || []).filter((p) => p.image?.trim());
  const hasIntro = Boolean(intro.title?.trim() || intro.eyebrow?.trim() || intro.image || paragraphs.length);

  if (!hasIntro && valueItems.length === 0 && photos.length === 0) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-20 md:px-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">About</p>
        <p className="mt-4 max-w-md text-muted-foreground">
          This page is empty until content is added in Admin → Website → About.
        </p>
      </div>
    );
  }

  return (
    <div>
      {hasIntro && (
        <div className="mx-auto max-w-[1440px] px-4 py-14 md:px-10 md:py-20">
          {intro.eyebrow ? <Eyebrow>{intro.eyebrow}</Eyebrow> : null}
          {intro.title ? (
            <h1 className="mt-3 max-w-3xl text-[11vw] leading-[0.95] sm:text-6xl md:text-7xl">
              {intro.title}
            </h1>
          ) : null}
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            {intro.image ? (
              <FocusIn className="crosshair relative aspect-[4/3] overflow-hidden border border-border">
                <img
                  src={mediaUrl(intro.image)}
                  alt={intro.title || "About"}
                  className="h-full w-full object-cover"
                />
                <Brackets size={26} className="text-foreground" />
              </FocusIn>
            ) : null}
            {paragraphs.length > 0 ? (
              <div className="space-y-5 text-muted-foreground">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p.text}</p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {values.visible !== false && valueItems.length > 0 && (
        <Section invert>
          <div className="grid gap-10 md:grid-cols-3">
            {valueItems.map((v, i) => (
              <FocusIn key={`${v.number}-${i}`}>
                {v.number ? (
                  <p className="font-mono text-[11px] tracking-[0.22em] opacity-60">{v.number}</p>
                ) : null}
                {v.title ? <h2 className="mt-3 text-2xl">{v.title}</h2> : null}
                {v.body ? <p className="mt-3 opacity-75">{v.body}</p> : null}
              </FocusIn>
            ))}
          </div>
        </Section>
      )}

      {team.visible !== false && (team.title || team.eyebrow || photos.length > 0) && (
        <Section>
          {team.eyebrow ? <Eyebrow>{team.eyebrow}</Eyebrow> : null}
          {team.title ? <h2 className="mt-2 text-3xl md:text-4xl">{team.title}</h2> : null}
          {photos.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {photos.map((photo, i) => (
                <FocusIn
                  key={`${photo.image}-${i}`}
                  className="crosshair relative aspect-[3/4] overflow-hidden border border-border"
                >
                  <img
                    src={mediaUrl(photo.image)}
                    alt="Team"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </FocusIn>
              ))}
            </div>
          ) : null}
        </Section>
      )}
    </div>
  );
}
