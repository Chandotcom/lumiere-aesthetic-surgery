import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container, Eyebrow, Heading } from "@/components/ds";
import { Reveal } from "@/components/motion/reveal";
import { galleryCases } from "@/lib/content/gallery";
import { getProcedure } from "@/lib/content/procedures";
import { ResultsPreview } from "./results-preview";

/**
 * Homepage before/after teaser. The preview stays locked until the visitor confirms 18+
 * (shared with the gallery), then shows one featured case with the comparison slider.
 */
export function ResultsTeaser() {
  // Featured: newest face case (faces carry no nudity risk in the preview).
  const c = galleryCases.find((x) => x.category === "Face") ?? galleryCases[0];
  const featured = {
    slug: c.slug,
    number: c.number,
    category: c.category,
    procedureName: getProcedure(c.procedureSlug)?.name ?? "Case",
    notes: c.notes,
    ageRange: c.ageRange,
    timeAfter: c.timeAfter,
  };

  return (
    <section aria-labelledby="results-heading" className="grain section-y bg-ink text-ivory">
      <Container size="wide" className="media-pair grid items-center gap-14 md:gap-x-16 lg:gap-x-20">
        <Reveal className="stack">
          <Eyebrow className="text-sand">Before &amp; after</Eyebrow>
          <Heading level={2} id="results-heading">
            Real results, <em>shared with consent.</em>
          </Heading>
          <p className="text-ivory/75">
            Browse our gallery by procedure. Every photo is unretouched and published only with
            written patient permission. Individual results vary.
          </p>
          <div data-slot="actions">
            <ButtonLink size="cta" variant="outline-light" href="/gallery">
              Enter the gallery <ArrowRight />
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={150} className="media-pair-img max-md:w-full">

          <ResultsPreview featured={featured} />
        </Reveal>
      </Container>
    </section>
  );
}
