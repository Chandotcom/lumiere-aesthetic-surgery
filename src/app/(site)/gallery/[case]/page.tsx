import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, BadgeCheck, ChevronRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container, Eyebrow, Heading, TextLink } from "@/components/ds";
import { AgeGate } from "@/components/gallery/age-gate";
import { CaseViewer } from "@/components/gallery/case-viewer";
import { ThumbPair } from "@/components/gallery/thumb-pair";
import { JsonLd } from "@/components/seo/json-ld";
import { caseTitle } from "@/lib/content/gallery";
import { getCasesForProcedure, getGalleryCase, getGalleryCases } from "@/lib/gallery/read";
import { categories, getProcedure } from "@/lib/content/procedures";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { site } from "@/lib/site";

export async function generateStaticParams() {
  // Cases published later render on first visit and are then cached (dynamicParams).
  const slugs = (await getGalleryCases()).map((c) => ({ case: c.slug }));
  // Cache Components needs at least one param to prerender; this placeholder just 404s.
  return slugs.length ? slugs : [{ case: "none" }];
}

export async function generateMetadata({ params }: PageProps<"/gallery/[case]">): Promise<Metadata> {
  const c = await getGalleryCase((await params).case);
  const p = c && getProcedure(c.procedureSlug);
  if (!c || !p) return {};
  return {
    title: `${p.name} Before & After — Case ${c.number}`,
    description: `${p.name} results for a patient aged ${c.ageRange}, photographed ${c.timeAfter} after treatment. ${c.notes}`,
    alternates: { canonical: `/gallery/${c.slug}` },
  };
}

/** params are read inside <Suspense> so client navigations stay instant (see procedures page). */
export default function CasePage({ params }: PageProps<"/gallery/[case]">) {
  return (
    <Suspense fallback={<CaseSkeleton />}>
      <CaseContent params={params} />
    </Suspense>
  );
}

function CaseSkeleton() {
  return (
    <Container size="wide" className="grid gap-12 pt-24 pb-(--section-y) md:grid-cols-12 md:gap-8" aria-busy="true">
      <div className="aspect-[4/5] animate-pulse bg-line/60 md:col-span-7" />
      <div className="stack md:col-span-4 md:col-start-9">
        <div className="h-3 w-24 animate-pulse bg-line" />
        <div className="h-12 w-3/4 animate-pulse bg-line" />
        <div className="h-32 w-full animate-pulse bg-line/60" />
      </div>
    </Container>
  );
}

function GatePreview() {
  return (
    <div className="grid gap-12 md:grid-cols-12 md:gap-8">
      <div className="aspect-[4/5] bg-[linear-gradient(160deg,#e6e1da,#d8c3a5)] md:col-span-7" />
      <div className="hidden md:col-span-4 md:col-start-9 md:block">
        <div className="h-48 bg-line/60" />
      </div>
    </div>
  );
}

async function CaseContent({ params }: { params: PageProps<"/gallery/[case]">["params"] }) {
  const c = await getGalleryCase((await params).case);
  const p = c && getProcedure(c.procedureSlug);
  if (!c || !p) notFound();

  const category = categories.find((x) => x.name === c.category)!;
  const siblings = await getCasesForProcedure(c.procedureSlug);
  const idx = siblings.findIndex((x) => x.slug === c.slug);
  const prev = siblings[(idx - 1 + siblings.length) % siblings.length];
  const next = siblings[(idx + 1) % siblings.length];
  const more = siblings.filter((x) => x.slug !== c.slug).slice(0, 3);

  const details = [
    ["Procedure", p.name],
    ["Patient age", c.ageRange],
    ["Photographed", `${c.timeAfter} after`],
    ["Angles", c.views.join(", ")],
    ["Surgeon", site.surgeon],
  ];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Gallery", path: "/gallery" },
          { name: p.name, path: `/gallery?procedure=${p.slug}` },
          { name: `Case ${c.number}`, path: `/gallery/${c.slug}` },
        ])}
      />

      <section className="bg-ivory pb-(--section-y)">
        <Container size="wide" className="pt-8 md:pt-10">
          <nav aria-label="Breadcrumb" className="mb-10 md:mb-14">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs tracking-wide text-stone uppercase">
              <li><Link href="/gallery" className="hover:text-bronze">Gallery</Link></li>
              <ChevronRight aria-hidden className="size-3" />
              <li>
                <Link href={`/gallery?category=${category.id}`} className="hover:text-bronze">{c.category}</Link>
              </li>
              <ChevronRight aria-hidden className="size-3" />
              <li>
                <Link href={`/gallery?procedure=${p.slug}`} className="hover:text-bronze">{p.name}</Link>
              </li>
              <ChevronRight aria-hidden className="size-3" />
              <li aria-current="page" className="text-ink">Case {c.number}</li>
            </ol>
          </nav>

          <AgeGate preview={<GatePreview />}>
            {/* Viewer column sizes to the viewer; details sit beside it; the pair is centred */}
            <div className="grid gap-12 md:grid-cols-[auto_minmax(0,26rem)] md:justify-center md:gap-14 lg:gap-24">
              <div>
                <CaseViewer category={c.category} views={c.views} label={caseTitle(c)} photos={c.photos} />
              </div>

              <div className="stack md:sticky md:top-[calc(var(--header-h)+2rem)] md:self-start">
                <Eyebrow>{c.category} · Case {c.number}</Eyebrow>
                <Heading level={1} size="h2">
                  {p.name} <em>before &amp; after</em>
                </Heading>
                <p className="text-stone">{c.notes}</p>

                <dl className="border-t border-line">
                  {details.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-6 border-b border-line py-3 text-sm">
                      <dt className="text-stone">{k}</dt>
                      <dd className="text-right text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>

                <p className="flex items-start gap-2 text-xs text-stone">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-bronze" aria-hidden />
                  Unretouched photos, shared with the patient’s written consent. Individual results vary.
                </p>

                <div data-slot="actions" className="stack gap-3!">
                  <ButtonLink size="cta-lg" className="w-full" href={`/consultation?procedure=${p.slug}`}>
                    Request a consultation <ArrowRight />
                  </ButtonLink>
                  <TextLink href={`/procedures/${p.slug}`} className="self-center text-sm">
                    About {p.name.toLowerCase()}: cost, recovery &amp; FAQs
                  </TextLink>
                </div>

                {siblings.length > 1 && (
                  <nav aria-label={`More ${p.name} cases`} className="grid grid-cols-2 border-t border-line pt-5 text-sm">
                    <Link href={`/gallery/${prev.slug}`} className="group inline-flex items-center gap-2 text-stone hover:text-ink">
                      <ArrowLeft aria-hidden className="size-4 transition-transform group-hover:-translate-x-0.5" />
                      Case {prev.number}
                    </Link>
                    <Link href={`/gallery/${next.slug}`} className="group inline-flex items-center justify-end gap-2 text-stone hover:text-ink">
                      Case {next.number}
                      <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </nav>
                )}
              </div>
            </div>

            {more.length > 0 && (
              <div className="mt-(--section-y) border-t border-line pt-(--section-intro)">
                <div className="section-intro flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <Heading level={2} size="h3">
                    More {p.name.toLowerCase()} <em>results</em>
                  </Heading>
                  <TextLink href={`/gallery?procedure=${p.slug}`} className="self-start text-sm md:self-auto">
                    All {siblings.length} {p.name.toLowerCase()} cases
                  </TextLink>
                </div>
                <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {more.map((m) => (
                    <li key={m.slug}>
                      <Link href={`/gallery/${m.slug}`} prefetch className="group block">
                        <ThumbPair category={m.category} pair={m.photos?.[m.views[0]]} label={caseTitle(m)} />
                        <p className="mt-4 flex justify-between gap-4 text-sm">
                          <span className="text-ink transition-colors group-hover:text-bronze">{m.notes}</span>
                          <span className="numeral shrink-0 text-xs text-stone">#{m.number}</span>
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AgeGate>
        </Container>
      </section>
    </>
  );
}
