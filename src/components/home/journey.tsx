import Image from "next/image";
import { Container, Eyebrow, Heading } from "@/components/ds";
import { Accent } from "@/components/ds/accent";
import { Reveal } from "@/components/motion/reveal";
import { getHomeContent } from "@/lib/cms/home";

/** The patient journey as a numbered timeline. */
export async function Journey() {
  const { journey } = await getHomeContent();
  return (
    <section aria-labelledby="journey-heading" className="section-y bg-cream">
      <Container size="wide">
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          <Reveal className="stack md:col-span-5">
            <Eyebrow>Your journey</Eyebrow>
            <Heading level={2} id="journey-heading">
              <Accent text={journey.heading} />
            </Heading>
            <p className="lead max-w-md">{journey.intro}</p>
          </Reveal>
          <Reveal variant="image" className="relative aspect-[16/10] overflow-hidden md:col-span-6 md:col-start-7">
            <Image
              src={journey.image.src}
              alt={journey.image.alt}
              fill
              sizes="(min-width: 840px) 50vw, 100vw"
              className="object-cover"
            />
          </Reveal>
        </div>

        <ol className="mt-(--section-intro) grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {journey.steps.map((s, i) => (
            <Reveal as="li" variant="content" key={`${i}-${s.title}`} delay={i * 120} className="flex flex-col gap-5 bg-cream p-8 lg:p-10">
              <span className="numeral text-h2 font-light text-bronze">{String(i + 1).padStart(2, "0")}</span>
              <Heading level={3} size="h4">
                {s.title}
              </Heading>
              <p className="text-sm text-stone">{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
