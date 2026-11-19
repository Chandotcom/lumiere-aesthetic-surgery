import type { Metadata } from "next";
import { seoMetadata } from "@/lib/cms/settings";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container, Eyebrow, Heading } from "@/components/ds";
import { Reveal } from "@/components/motion/reveal";
import { ProcedureCard } from "@/components/procedures/procedure-card";
import { JsonLd } from "@/components/seo/json-ld";
import { getProcedures } from "@/lib/cms/procedures";
import { categories } from "@/lib/content/procedures";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { site } from "@/lib/site";

export function generateMetadata(): Promise<Metadata> {
  return seoMetadata("procedures");
}

export default async function ProceduresPage() {
  const procedures = await getProcedures();
  const proceduresIn = (category: string) => procedures.filter((p) => p.category === category);
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Procedures", path: "/procedures" },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Procedures at ${site.name}`,
          itemListElement: procedures.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: new URL(`/procedures/${p.slug}`, site.url).toString(),
            name: p.name,
          })),
        }}
      />

      {/* Intro */}
      <section className="bg-ivory pt-(--section-y) pb-12 md:pb-16">
        <Container size="wide" className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="stack md:col-span-7">
            <Eyebrow>Procedures</Eyebrow>
            <Heading level={1} size="h1">
              Treatments, <em>thoughtfully</em> tailored.
            </Heading>
          </div>
          <p className="lead max-w-md text-balance md:col-span-4 md:col-start-9">
            Every plan begins with a private consultation. Explore what we offer — then let Dr.
            Marsh help you decide what’s right for you.
          </p>
        </Container>
      </section>

      {/* Sticky category jump links */}
      <nav
        aria-label="Procedure categories"
        className="sticky top-(--header-h) z-30 border-y border-line bg-ivory/90 backdrop-blur-md"
      >
        <ul className="container-wide flex gap-8 overflow-x-auto py-4 [scrollbar-width:none] md:gap-12">
          {categories.map((c, i) => (
            <li key={c.id} className="shrink-0">
              <a
                href={`#${c.id}`}
                className="flex items-baseline gap-2 text-label tracking-label text-ink uppercase transition-colors hover:text-bronze"
              >
                <span className="numeral text-xs text-stone">0{i + 1}</span>
                {c.name}
                <span className="text-xs text-stone">({proceduresIn(c.name).length})</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Categories */}
      {categories.map((c, i) => (
        <section
          key={c.id}
          id={c.id}
          aria-labelledby={`${c.id}-heading`}
          className={`section-y scroll-mt-[calc(var(--header-h)+3.5rem)] ${i % 2 ? "bg-cream" : "bg-ivory"}`}
        >
          <Container size="wide">
            <Reveal className="section-intro grid gap-6 md:grid-cols-12 md:items-end">
              <div className="flex items-baseline gap-5 md:col-span-7">
                <span className="numeral text-h3 text-bronze">0{i + 1}</span>
                <Heading level={2} id={`${c.id}-heading`}>
                  {c.name}
                </Heading>
              </div>
              <p className="max-w-sm text-stone md:col-span-4 md:col-start-9">{c.intro}</p>
            </Reveal>
            <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
              {proceduresIn(c.name).map((p, k) => (
                <Reveal as="li" key={p.slug} delay={k * 100}>
                  <ProcedureCard p={p} />
                </Reveal>
              ))}
            </ul>
          </Container>
        </section>
      ))}

      {/* Undecided CTA */}
      <section className="grain section-y bg-ink text-ivory">
        <Container size="wide" className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="stack md:col-span-7">
            <Eyebrow className="text-sand">Not sure where to start?</Eyebrow>
            <Heading level={2}>
              Let’s find the right plan, <em>together.</em>
            </Heading>
            <p className="max-w-lg text-ivory/75">
              Many patients arrive with a feeling rather than a procedure in mind. That’s exactly
              what your consultation is for.
            </p>
          </div>
          <div className="md:col-span-4 md:col-start-9 md:justify-self-end">
            <ButtonLink size="cta-lg" className="bg-ivory text-ink hover:bg-white" href="/consultation">
              Request a consultation <ArrowRight />
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
