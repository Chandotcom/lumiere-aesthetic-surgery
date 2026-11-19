import Image from "next/image";
import { Container, Eyebrow, TextLink } from "@/components/ds";
import { Accent } from "@/components/ds/accent";
import { Reveal } from "@/components/motion/reveal";
import { getHomeContent } from "@/lib/cms/home";

/** Brand philosophy: one oversized typographic statement with a small editorial image. */
export async function Statement() {
  const { statement } = await getHomeContent();
  return (
    <section className="section-y bg-ivory">
      <Container size="wide" className="grid gap-12 md:grid-cols-12 md:gap-8">
        <Reveal className="md:col-span-3">
          <Eyebrow>Our philosophy</Eyebrow>
        </Reveal>

        <div className="md:col-span-9">
          <Reveal>
            <p className="font-heading text-h2 leading-[1.2] font-light text-ink">
              <Accent text={statement.text} emClassName="not-italic text-bronze" />
            </p>
          </Reveal>

          <div className="mt-14 grid items-end gap-10 border-t border-line pt-10 sm:grid-cols-2 md:mt-20">
            <Reveal variant="image" className="relative aspect-[4/3] overflow-hidden sm:aspect-[5/4]">
              <Image
                src={statement.image.src}
                alt={statement.image.alt}
                fill
                sizes="(min-width: 840px) 35vw, (min-width: 480px) 50vw, 100vw"
                className="object-cover"
              />
            </Reveal>
            <Reveal delay={150} className="stack">
              <p className="text-stone">{statement.body}</p>
              <p>
                <TextLink href="/about">Meet Dr. Marsh</TextLink>
              </p>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
