import { createFileRoute } from "@tanstack/react-router";
import { Brackets, Eyebrow, FocusIn } from "@/components/site/focus";
import { Section } from "@/components/site/rail";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Aperture — Precision, Published" },
      { name: "description", content: "Founded in Rotterdam in 2019, Aperture builds consumer electronics to published tolerances in small runs." },
      { property: "og:title", content: "About Aperture — Precision, Published" },
      { property: "og:description", content: "How Aperture builds hardware to published tolerances." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div>
      <div className="mx-auto max-w-[1440px] px-4 py-14 md:px-10 md:py-20">
        <Eyebrow>Est. 2019 · Rotterdam</Eyebrow>
        <h1 className="mt-3 max-w-3xl text-[11vw] leading-[0.95] sm:text-6xl md:text-7xl">
          We started because nobody would publish their numbers.
        </h1>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <FocusIn className="crosshair relative aspect-[4/3] overflow-hidden border border-border">
            <img
              src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1400&q=80"
              alt="Aperture workshop"
              className="h-full w-full object-cover"
            />
            <Brackets size={26} className="text-foreground" />
          </FocusIn>
          <div className="space-y-5 text-muted-foreground">
            <p>
              Aperture began in a rented unit behind a shipyard, with a borrowed anechoic chamber and a
              disagreement about whether a battery figure measured at 50% volume means anything.
            </p>
            <p>
              Precision, to us, is not a texture. It is a number you can check against the product in your hand.
              Every device ships with the measured curve it was tested against, the tolerance it was machined to,
              and the cycle count at which its cell drops below 84% capacity.
            </p>
            <p>
              We run small batches — usually 500 to 2,000 units — because that is the largest quantity we can
              test individually without outsourcing the part of the job we care most about.
            </p>
          </div>
        </div>
      </div>

      <Section invert>
        <div className="grid gap-10 md:grid-cols-3">
          {[
            { n: "01", t: "Measure first", b: "No product enters the catalogue before its datasheet is written and independently checked." },
            { n: "02", t: "Fasteners, not glue", b: "Structural adhesive is a decision to make a product disposable. We use threads wherever sealing allows." },
            { n: "03", t: "Five years of spares", b: "Pads, cells, cables and clamps stay stocked for five years after a product is discontinued." },
          ].map((v) => (
            <FocusIn key={v.n}>
              <p className="font-mono text-[11px] tracking-[0.22em] opacity-60">{v.n}</p>
              <h2 className="mt-3 text-2xl">{v.t}</h2>
              <p className="mt-3 opacity-75">{v.b}</p>
            </FocusIn>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>The bench</Eyebrow>
        <h2 className="mt-2 text-3xl md:text-4xl">Fourteen people, one building</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            "1573497019940-1c28c88b4f3e",
            "1560250097-0b93528c311a",
            "1519085360753-af0119f7cbe7",
            "1507003211169-0a1dd7228f2d",
          ].map((id) => (
            <FocusIn key={id} className="crosshair relative aspect-[3/4] overflow-hidden border border-border">
              <img
                src={`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=700&q=80`}
                alt="Team member at the workshop"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </FocusIn>
          ))}
        </div>
      </Section>
    </div>
  );
}