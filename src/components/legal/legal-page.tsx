import { Container, Eyebrow, Heading } from "@/components/ds";
import { Prose } from "@/components/journal/prose";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema } from "@/lib/seo/schema";

export type LegalSection = { id: string; title: string; body: string /* markdown */ };

/**
 * Shared layout for policy pages: intro, sticky table of contents (desktop), anchored sections.
 * Demo text — must be reviewed by the clinic's own legal counsel before real use.
 */
export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  path,
  sections,
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro: string;
  updated: string;
  path: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: eyebrow, path },
        ])}
      />
      <section className="bg-ivory pt-(--section-y) pb-12 md:pb-16">
        <Container size="wide" className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="stack md:col-span-7">
            <Eyebrow>{eyebrow}</Eyebrow>
            <Heading level={1} size="h1">
              {title}
            </Heading>
          </div>
          <div className="stack gap-3! md:col-span-4 md:col-start-9">
            <p className="text-stone">{intro}</p>
            <p className="text-xs tracking-wide text-stone uppercase">Last updated {updated}</p>
          </div>
        </Container>
      </section>

      <section className="border-t border-line bg-ivory pb-(--section-y)">
        <Container size="wide" className="grid gap-12 pt-12 md:grid-cols-12 md:gap-8 md:pt-16">
          <nav aria-label="On this page" className="md:sticky md:top-[calc(var(--header-h)+2rem)] md:col-span-3 md:self-start">
            <p className="eyebrow mb-4">On this page</p>
            <ol className="space-y-2.5 border-l border-line pl-5 text-sm">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex gap-2 text-stone transition-colors hover:text-bronze">
                    <span className="numeral text-xs text-stone/60">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="md:col-span-8 md:col-start-5 lg:col-span-7 lg:col-start-5">
            <p className="mb-12 border-l-2 border-bronze bg-cream px-5 py-4 text-sm text-stone">
              <strong className="font-medium text-ink">Demo document.</strong> This text is a
              template for a fictional practice and is not legal advice. A real clinic must have it
              reviewed by qualified counsel for its jurisdiction.
            </p>
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-[calc(var(--header-h)+2rem)] border-t border-line pt-10 pb-4 first-of-type:border-t-0 first-of-type:pt-0">
                <h2 id={`${s.id}-h`} className="mb-5 flex items-baseline gap-4 font-heading text-h3 text-ink">
                  <span className="numeral text-sm text-bronze">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                <Prose markdown={s.body} />
              </section>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
