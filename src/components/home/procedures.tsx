import { Container, Eyebrow, Heading } from "@/components/ds";
import { Reveal } from "@/components/motion/reveal";
import { ProcedureExplorer } from "./procedure-explorer";

export function Procedures() {
  return (
    <section aria-labelledby="procedures-heading" className="grain section-y bg-ink text-ivory">
      <Container size="wide">
        <Reveal className="section-intro grid gap-6 md:grid-cols-12 md:items-end">
          <div className="stack md:col-span-7">
            <Eyebrow className="text-sand">Procedures</Eyebrow>
            <Heading level={2} id="procedures-heading">
              Expertise for <em>face, breast</em> and body.
            </Heading>
          </div>
          <p className="max-w-sm text-ivory/70 md:col-span-4 md:col-start-9">
            Each treatment plan is personal. Explore the areas we focus on — every journey begins
            with a private consultation.
          </p>
        </Reveal>
        <ProcedureExplorer />
      </Container>
    </section>
  );
}
