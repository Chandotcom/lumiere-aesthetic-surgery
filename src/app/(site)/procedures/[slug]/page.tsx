import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Check, ChevronRight, CreditCard, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container, Eyebrow, Heading, TextLink } from "@/components/ds";
import { Faq } from "@/components/home/faq";
import { FinalCta } from "@/components/home/final-cta";
import { Reveal } from "@/components/motion/reveal";
import { ProcedureCard } from "@/components/procedures/procedure-card";
import { JsonLd } from "@/components/seo/json-ld";
import { galleryCases } from "@/lib/content/gallery";
import { categories, formatPrice, monthlyFrom, procedures } from "@/lib/content/procedures";
import { getProcedureBySlug, getProcedures } from "@/lib/cms/procedures";
import { breadcrumbSchema, procedureSchema } from "@/lib/seo/schema";
import { site } from "@/lib/site";

// Every procedure page is prerendered at build time (Cache Components requires ≥1 param).
export function generateStaticParams() {
  return procedures.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/procedures/[slug]">): Promise<Metadata> {
  const p = await getProcedureBySlug((await params).slug);
  if (!p) return {};
  return {
    title: `${p.name} — Cost, Recovery & Results`,
    description: p.summary,
    alternates: { canonical: `/procedures/${p.slug}` },
    openGraph: { images: [{ url: `${p.image.src}?w=1200&h=630&fit=crop`, alt: p.image.alt }] },
  };
}

// Content review date shown for E-E-A-T. Static so the page stays fully prerendered.
const REVIEWED = "November 2026";

/**
 * URL data (params) is read inside <Suspense> so client navigations get an instant App Shell
 * (header/footer + skeleton) while content streams. Direct visits are still fully prerendered
 * via generateStaticParams.
 */
export default function ProcedurePage({ params }: PageProps<"/procedures/[slug]">) {
  return (
    <Suspense fallback={<ProcedureSkeleton />}>
      <ProcedureContent params={params} />
    </Suspense>
  );
}

function ProcedureSkeleton() {
  return (
    <section aria-busy="true" aria-label="Loading procedure" className="relative overflow-hidden bg-ivory">
      <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[36%] bg-cream md:block" />
      <Container size="wide" className="relative grid items-center gap-14 pt-24 pb-(--section-y) md:grid-cols-12 md:gap-8">
        <div className="stack md:col-span-6">
          <div className="h-3 w-24 animate-pulse bg-line" />
          <div className="h-14 w-3/4 animate-pulse bg-line" />
          <div className="h-24 w-full animate-pulse bg-line/60" />
          <div className="h-12 w-56 animate-pulse bg-line" />
        </div>
        <div className="mx-auto aspect-[4/5] w-full max-w-md animate-pulse bg-line/60 md:col-span-5 md:col-start-8 md:mr-0" />
      </Container>
    </section>
  );
}

async function ProcedureContent({ params }: { params: PageProps<"/procedures/[slug]">["params"] }) {
  const p = await getProcedureBySlug((await params).slug);
  if (!p) notFound();

  const category = categories.find((c) => c.name === p.category)!;
  const related = (await getProcedures()).filter((x) => x.category === p.category && x.slug !== p.slug);
  const surgical = p.category !== "Non-surgical";
  const caseCount = galleryCases.filter((c) => c.procedureSlug === p.slug).length;
  const facts = [
    { label: "Procedure time", value: p.facts.duration },
    { label: "Anesthesia", value: p.facts.anesthesia },
    { label: "Recovery", value: p.facts.recovery },
    { label: "Results last", value: p.facts.results },
  ];

  return (
    <>
      <JsonLd
        data={procedureSchema({
          name: p.name,
          summary: p.summary,
          slug: p.slug,
          category: p.category,
          image: p.image.src,
          recovery: p.facts.recovery,
          surgical,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Procedures", path: "/procedures" },
          { name: p.name, path: `/procedures/${p.slug}` },
        ])}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ivory">
        <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[36%] bg-cream md:block" />
        <Container size="wide" className="relative pt-8 pb-(--section-y) md:pt-10">
          <nav aria-label="Breadcrumb" className="mb-10 md:mb-14">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs tracking-wide text-stone uppercase">
              <li>
                <Link href="/" className="hover:text-bronze">Home</Link>
              </li>
              <ChevronRight aria-hidden className="size-3" />
              <li>
                <Link href={`/procedures#${category.id}`} className="hover:text-bronze">
                  {p.category}
                </Link>
              </li>
              <ChevronRight aria-hidden className="size-3" />
              <li aria-current="page" className="text-ink">{p.name}</li>
            </ol>
          </nav>

          <div className="media-pair grid items-center gap-14 md:gap-x-16 lg:gap-x-20">
            <div className="stack">
              <Eyebrow>{p.category}</Eyebrow>
              <Heading level={1} size="h1">
                {p.name}
              </Heading>
              {/* Direct answer first — what search & AI answer engines quote */}
              <p className="lead max-w-xl">{p.summary}</p>

              <dl className="grid grid-cols-2 border-t border-line">
                {facts.map((f, i) => (
                  <div
                    key={f.label}
                    className={`border-b border-line py-4 ${i % 2 === 0 ? "pr-4" : "border-l border-line pl-5"}`}
                  >
                    <dt className="text-xs tracking-wide text-stone uppercase">{f.label}</dt>
                    <dd className="mt-1 text-ink">{f.value}</dd>
                  </div>
                ))}
              </dl>

              <div data-slot="actions" className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink size="cta-lg" href={`/consultation?procedure=${p.slug}`}>
                  Request a consultation <ArrowRight />
                </ButtonLink>
                <p className="text-sm text-stone sm:ml-3">
                  From <span className="font-medium text-ink">{formatPrice(p.price.from)}</span>
                  {p.price.from >= 1000 && <> · or about ${monthlyFrom(p.price.from)}/mo*</>}
                </p>
              </div>
              {caseCount > 0 && (
                <p>
                  <TextLink href={`/gallery?procedure=${p.slug}`} className="text-sm">
                    View {p.name.toLowerCase()} results ({caseCount})
                  </TextLink>
                </p>
              )}
            </div>

            <div className="media-pair-img relative mx-auto max-w-md max-md:w-full md:mx-0 md:max-w-none">
              <div aria-hidden className="absolute -bottom-6 -left-6 hidden h-3/4 w-3/4 bg-sand/45 md:block" />
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <Image
                  src={p.image.src}
                  alt={p.image.alt}
                  fill
                  preload
                  sizes="(min-width: 1024px) 40vw, (min-width: 840px) 50vw, 28rem"
                  className="object-cover object-[50%_30%]"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Candidates */}
      <section aria-labelledby="candidate-heading" className="section-y bg-cream">
        <Container size="wide" className="grid gap-12 md:grid-cols-12 md:gap-8">
          <Reveal className="stack md:col-span-5">
            <Eyebrow>Is it right for you?</Eyebrow>
            <Heading level={2} id="candidate-heading">
              {p.name} may suit you <em>if…</em>
            </Heading>
            <p className="max-w-md text-stone">
              The best way to know is a private consultation, where Dr. Marsh reviews your goals,
              health and anatomy — and is candid when another option would serve you better.
            </p>
          </Reveal>
          <Reveal delay={100} className="md:col-span-6 md:col-start-7">
            <ul className="border-t border-line">
              {p.idealFor.map((x) => (
                <li key={x} className="flex gap-4 border-b border-line py-5 text-ink">
                  <Check aria-hidden className="mt-1 size-4 shrink-0 text-bronze" />
                  {x}
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      {/* Recovery timeline */}
      <section aria-labelledby="recovery-heading" className="section-y bg-ivory">
        <Container size="wide">
          <Reveal className="section-intro grid gap-6 md:grid-cols-12 md:items-end">
            <div className="stack md:col-span-7">
              <Eyebrow>{surgical ? "Recovery" : "What to expect"}</Eyebrow>
              <Heading level={2} id="recovery-heading">
                {surgical ? (
                  <>
                    Your recovery, <em>step by step.</em>
                  </>
                ) : (
                  <>
                    Before, during <em>and after.</em>
                  </>
                )}
              </Heading>
            </div>
            <p className="max-w-sm text-stone md:col-span-4 md:col-start-9">
              A typical timeline. You’ll receive a written plan tailored to you, plus a direct line
              to our nursing team.
            </p>
          </Reveal>
          <ol className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {p.timeline.map((t, i) => (
              <Reveal as="li" variant="content" key={t.when} delay={i * 100} className="flex flex-col gap-4 bg-ivory p-8 lg:p-10">
                <span className="numeral text-sm text-bronze">0{i + 1}</span>
                <Heading level={3} size="h4">
                  {t.when}
                </Heading>
                <p className="text-sm text-stone">{t.what}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* Cost & financing */}
      <section aria-labelledby="cost-heading" className="grain section-y bg-ink text-ivory">
        <Container size="wide" className="grid gap-12 md:grid-cols-12 md:items-center md:gap-8">
          <Reveal className="stack md:col-span-6">
            <Eyebrow className="text-sand">Investment</Eyebrow>
            <Heading level={2} id="cost-heading">
              Clear pricing, <em>no surprises.</em>
            </Heading>
            <p className="max-w-md text-ivory/75">
              After your consultation you’ll receive a written, all-inclusive quote — surgeon,
              facility{surgical ? ", anesthesia" : ""} and follow-up care.
            </p>
            <p>
              <TextLink href="/consultation" className="text-sand! hover:text-ivory!">
                Ask about financing options
              </TextLink>
            </p>
          </Reveal>
          <Reveal delay={100} className="md:col-span-5 md:col-start-8">
            <div className="border border-ivory/15 p-8 md:p-10">
              <p className="text-xs tracking-wide text-ivory/60 uppercase">Typical range</p>
              <p className="mt-2 font-heading text-h1 font-light">
                {formatPrice(p.price.from)}
                <span className="text-ivory/40"> – </span>
                {formatPrice(p.price.to)}
              </p>
              {p.price.from >= 1000 && (
                <p className="mt-6 flex items-center gap-3 border-t border-ivory/15 pt-6 text-sm text-ivory/80">
                  <CreditCard aria-hidden className="size-5 shrink-0 text-sand" />
                  Financing from about ${monthlyFrom(p.price.from)}/month*
                </p>
              )}
              <p className="mt-6 text-xs text-ivory/50">
                *Illustrative estimate only (60 months at ~9.9% APR), subject to credit approval.
                Your actual price depends on your personal treatment plan.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      <Faq
        items={p.faqs}
        heading={
          <>
            {p.name}, <em>answered.</em>
          </>
        }
      />

      {/* Medical review (E-E-A-T) */}
      <div className="bg-ivory">
        <Container size="wide">
          <p className="flex items-center gap-3 border-t border-line py-8 text-sm text-stone">
            <ShieldCheck aria-hidden className="size-5 shrink-0 text-bronze" />
            Medically reviewed by {site.surgeon} · Last reviewed {REVIEWED}. General information
            only — not a substitute for a personal consultation.
          </p>
        </Container>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="section-y bg-cream">
          <Container size="wide">
            <Reveal className="section-intro flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="stack">
                <Eyebrow>Explore more</Eyebrow>
                <Heading level={2} id="related-heading">
                  Other {p.category.toLowerCase()} <em>{surgical ? "procedures" : "treatments"}</em>
                </Heading>
              </div>
              <TextLink href={`/procedures#${category.id}`} className="self-start md:self-auto">
                All {p.category.toLowerCase()} {surgical ? "procedures" : "treatments"}
              </TextLink>
            </Reveal>
            <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r, k) => (
                <Reveal as="li" key={r.slug} delay={k * 100}>
                  <ProcedureCard p={r} />
                </Reveal>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <FinalCta />
    </>
  );
}
