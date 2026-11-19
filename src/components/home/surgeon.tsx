import Image from "next/image";
import { ButtonLink } from "@/components/ui/button-link";
import { Container, Eyebrow, Heading } from "@/components/ds";
import { Accent } from "@/components/ds/accent";
import { Reveal } from "@/components/motion/reveal";
import { getHomeContent } from "@/lib/cms/home";
import { site } from "@/lib/site";

export async function Surgeon() {
  const { surgeon } = await getHomeContent();
  return (
    <section id="surgeon" aria-labelledby="surgeon-heading" className="section-y scroll-mt-(--header-h) bg-ivory">
      <Container size="wide" className="grid gap-14 md:grid-cols-12 md:gap-8">
        <div className="relative md:col-span-5">
          <Reveal variant="image" className="relative aspect-[4/5] overflow-hidden">
            <Image
              src={surgeon.image.src}
              alt={surgeon.image.alt}
              fill
              sizes="(min-width: 840px) 40vw, 100vw"
              className="object-cover object-top"
            />
          </Reveal>
          <p className="mt-4 text-xs tracking-wide text-stone uppercase">
            {site.surgeon} — Founder &amp; lead surgeon
          </p>
        </div>

        <div className="stack md:col-span-6 md:col-start-7 md:justify-center">
          <Reveal className="stack">
            <Eyebrow>Meet your surgeon</Eyebrow>
            <Heading level={2} id="surgeon-heading">
              <Accent text={surgeon.heading} />
            </Heading>
          </Reveal>
          <Reveal delay={100}>
            <blockquote className="border-l-2 border-bronze pl-6 font-heading text-h4 font-light text-ink">
              “{surgeon.quote}”
            </blockquote>
          </Reveal>
          <Reveal delay={150}>
            <p className="lead">{surgeon.intro}</p>
          </Reveal>
          <Reveal delay={200}>
            <ul className="grid border-t border-line sm:grid-cols-2">
              {surgeon.credentials.map((c) => (
                <li key={c.value} className="border-b border-line py-4 pr-4 text-sm text-stone">
                  {c.value}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={250}>
            <dl className="grid grid-cols-2 gap-y-8 py-4 lg:grid-cols-4">
              {surgeon.stats.map((s) => (
                <div key={s.label} className="flex flex-col gap-1 pr-4">
                  <dt className="order-2 text-xs leading-snug text-stone">{s.label}</dt>
                  <dd className="order-1 font-heading text-h2 font-light text-ink">
                    {s.value}
                    <span className="text-bronze">{s.suffix}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal delay={300}>
            <ButtonLink size="cta" variant="outline" href="/consultation">
              Request a consultation
            </ButtonLink>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
