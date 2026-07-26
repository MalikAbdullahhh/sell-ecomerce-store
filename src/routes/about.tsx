import { createFileRoute } from "@tanstack/react-router";
import { Brackets, Eyebrow, FocusIn } from "@/components/site/focus";
import { Section } from "@/components/site/rail";
import { mediaUrl } from "@/lib/api";
import { usePageContent } from "@/lib/page-content";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Aperture — Precision, Published" },
      {
        name: "description",
        content:
          "Founded in Rotterdam in 2019, Aperture builds consumer electronics to published tolerances in small runs.",
      },
      { property: "og:title", content: "About Aperture — Precision, Published" },
      {
        property: "og:description",
        content: "How Aperture builds hardware to published tolerances.",
      },
    ],
  }),
  component: About,
});

function About() {
  const { section } = usePageContent("about");
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

  return (
    <div>
      <div className="mx-auto max-w-[1440px] px-4 py-14 md:px-10 md:py-20">
        <Eyebrow>{intro.eyebrow}</Eyebrow>
        <h1 className="mt-3 max-w-3xl text-[11vw] leading-[0.95] sm:text-6xl md:text-7xl">
          {intro.title}
        </h1>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <FocusIn className="crosshair relative aspect-[4/3] overflow-hidden border border-border">
            <img
              src={mediaUrl(intro.image)}
              alt={intro.title}
              className="h-full w-full object-cover"
            />
            <Brackets size={26} className="text-foreground" />
          </FocusIn>
          <div className="space-y-5 text-muted-foreground">
            {(intro.paragraphs || []).map((p, i) => (
              <p key={i}>{p.text}</p>
            ))}
          </div>
        </div>
      </div>

      {values.visible !== false && (
        <Section invert>
          <div className="grid gap-10 md:grid-cols-3">
            {(values.items || []).map((v, i) => (
              <FocusIn key={`${v.number}-${i}`}>
                <p className="font-mono text-[11px] tracking-[0.22em] opacity-60">{v.number}</p>
                <h2 className="mt-3 text-2xl">{v.title}</h2>
                <p className="mt-3 opacity-75">{v.body}</p>
              </FocusIn>
            ))}
          </div>
        </Section>
      )}

      {team.visible !== false && (
        <Section>
          <Eyebrow>{team.eyebrow}</Eyebrow>
          <h2 className="mt-2 text-3xl md:text-4xl">{team.title}</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {(team.photos || []).map((photo, i) => (
              <FocusIn
                key={`${photo.image}-${i}`}
                className="crosshair relative aspect-[3/4] overflow-hidden border border-border"
              >
                <img
                  src={mediaUrl(photo.image)}
                  alt="Team member at the workshop"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </FocusIn>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
