import Image from "next/image";
import { ArrowRight, Plus } from "lucide-react";
import { Container, Eyebrow, Heading, Section } from "@/components/ds";
import { Accent } from "@/components/ds/accent";
import { ResultsTeaser } from "@/components/home/results-teaser";
import { Testimonials } from "@/components/home/testimonials";
import { Prose } from "@/components/journal/prose";
import { Reveal } from "@/components/motion/reveal";
import { ProcedureCard } from "@/components/procedures/procedure-card";
import { JsonLd } from "@/components/seo/json-ld";
import { ButtonLink } from "@/components/ui/button-link";
import { getProcedures } from "@/lib/cms/procedures";
import type { Block } from "@/lib/cms/page-schema";
import { faqSchema } from "@/lib/seo/schema";
import { cn } from "@/lib/utils";

type Of<T extends Block["type"]> = Extract<Block, { type: T }>;
type Ctx = { id: string; level: 1 | 2 };

// CSS-only entrance for a first-section hero, so it never waits for JS (LCP), like the homepage.
const enter = "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:duration-1000 motion-safe:fill-mode-both";

/**
 * Renders a page's sections in order. The first section's heading is the page's h1; if the page
 * doesn't start with a hero, the title becomes a visually hidden h1 so the outline stays correct.
 */
export function PageBlocks({ title, blocks }: { title: string; blocks: Block[] }) {
  const startsWithHeading = blocks[0]?.type === "hero";
  return (
    <>
      {!startsWithHeading && <h1 className="sr-only">{title}</h1>}
      {blocks.map((b, i) => {
        const ctx: Ctx = { id: `section-${i + 1}`, level: i === 0 && startsWithHeading ? 1 : 2 };
        return <BlockView key={ctx.id} block={b} ctx={ctx} />;
      })}
    </>
  );
}

function BlockView({ block, ctx }: { block: Block; ctx: Ctx }) {
  switch (block.type) {
    case "hero":
      return <HeroBlock b={block} ctx={ctx} />;
    case "text":
      return <TextBlock b={block} ctx={ctx} />;
    case "mediaText":
      return <MediaTextBlock b={block} ctx={ctx} />;
    case "features":
      return <FeaturesBlock b={block} ctx={ctx} />;
    case "stats":
      return <StatsBlock b={block} ctx={ctx} />;
    case "faq":
      return <FaqBlock b={block} ctx={ctx} />;
    case "procedures":
      return <ProceduresBlock b={block} ctx={ctx} />;
    case "testimonials":
      return <Testimonials heading={block.heading} />;
    case "galleryTeaser":
      return <ResultsTeaser />;
    case "cta":
      return <CtaBlock b={block} ctx={ctx} />;
  }
}

function Buttons({ primary, secondary, light }: { primary?: { label: string; href: string }; secondary?: { label: string; href: string }; light?: boolean }) {
  if (!primary?.label && !secondary?.label) return null;
  return (
    <div data-slot="actions" className="flex flex-col gap-3 sm:flex-row">
      {primary?.label && (
        <ButtonLink size="cta-lg" href={primary.href} className={light ? "bg-ivory text-ink hover:bg-white" : undefined}>
          {primary.label} <ArrowRight />
        </ButtonLink>
      )}
      {secondary?.label && (
        <ButtonLink size="cta-lg" variant={light ? "outline-light" : "outline"} href={secondary.href}>
          {secondary.label}
        </ButtonLink>
      )}
    </div>
  );
}

function HeroBlock({ b, ctx }: { b: Of<"hero">; ctx: Ctx }) {
  const first = ctx.level === 1;
  return (
    <section aria-labelledby={`${ctx.id}-heading`} className="relative overflow-hidden bg-ivory">
      <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[36%] bg-cream md:block" />
      <div className="container-wide media-pair relative grid items-center gap-16 pt-12 pb-20 md:gap-x-16 md:py-20 lg:gap-x-20 lg:py-24">
        <div className={cn("stack", first && enter)}>
          {b.eyebrow && <Eyebrow>{b.eyebrow}</Eyebrow>}
          <Heading level={ctx.level} size="display" id={`${ctx.id}-heading`} className="text-ink">
            <Accent text={b.heading} />
          </Heading>
          {b.intro && <p className="lead max-w-[32rem] text-balance">{b.intro}</p>}
          <Buttons primary={b.primary} secondary={b.secondary} />
        </div>
        <div className="media-pair-img relative mx-auto max-w-md max-md:w-full md:mx-0 md:max-w-none">
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <Image
              src={b.image.src}
              alt={b.image.alt}
              fill
              preload={first}
              sizes="(min-width: 1024px) 40vw, (min-width: 840px) 50vw, 28rem"
              className="object-cover object-[50%_30%]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// Prose is styled for light backgrounds; on ink, lift its text colours.
const darkProse = "[&_a]:text-sand [&_h2]:text-ivory [&_h3]:text-ivory [&_li]:text-ivory/80 [&_p]:text-ivory/80 [&_strong]:text-ivory";

function TextBlock({ b, ctx }: { b: Of<"text">; ctx: Ctx }) {
  return (
    <Section tone={b.tone} aria-labelledby={b.heading ? `${ctx.id}-heading` : undefined} aria-label={b.heading ? undefined : "Text"}>
      <Container size="prose">
        <Reveal className={cn(b.tone === "dark" && darkProse)}>
          {b.heading && (
            <Heading level={ctx.level} id={`${ctx.id}-heading`} className="mb-8">
              <Accent text={b.heading} />
            </Heading>
          )}
          <Prose markdown={b.body} />
        </Reveal>
      </Container>
    </Section>
  );
}

function MediaTextBlock({ b, ctx }: { b: Of<"mediaText">; ctx: Ctx }) {
  return (
    <Section tone={b.tone} aria-labelledby={`${ctx.id}-heading`}>
      <Container size="wide" className="media-pair grid items-center gap-14 md:gap-x-16 lg:gap-x-20">
        <Reveal className={cn("stack", b.imageSide === "left" && "md:order-2")}>
          {b.eyebrow && <Eyebrow>{b.eyebrow}</Eyebrow>}
          <Heading level={ctx.level} id={`${ctx.id}-heading`}>
            <Accent text={b.heading} />
          </Heading>
          <p className={cn("whitespace-pre-line", b.tone === "dark" ? "text-ivory/80" : "text-stone")}>{b.body}</p>
          <Buttons primary={b.cta} light={b.tone === "dark"} />
        </Reveal>
        <Reveal variant="image" className={cn("media-pair-img max-md:w-full", b.imageSide === "left" && "md:order-1")}>
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <Image src={b.image.src} alt={b.image.alt} fill sizes="(min-width: 840px) 40vw, 100vw" className="object-cover" />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

function FeaturesBlock({ b, ctx }: { b: Of<"features">; ctx: Ctx }) {
  const dark = b.tone === "dark";
  return (
    <Section tone={b.tone} aria-labelledby={`${ctx.id}-heading`}>
      <Container size="wide">
        <Reveal className="section-intro stack max-w-2xl">
          <Heading level={ctx.level} id={`${ctx.id}-heading`}>
            <Accent text={b.heading} />
          </Heading>
          {b.intro && <p className={dark ? "text-ivory/75" : "text-stone"}>{b.intro}</p>}
        </Reveal>
        <ul className={cn("grid gap-px border sm:grid-cols-2 lg:grid-cols-3", dark ? "border-ivory/15 bg-ivory/15" : "border-line bg-line")}>
          {b.items.map((item, i) => (
            <li key={`${i}-${item.title}`} className={cn("p-8", dark ? "bg-ink" : b.tone === "alt" ? "bg-cream" : "bg-ivory")}>
              <Reveal variant="content" delay={i * 60} className="stack gap-3!">
                <span className={cn("numeral text-xs", dark ? "text-sand" : "text-bronze")}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-heading text-h4">{item.title}</h3>
                <p className={cn("text-sm", dark ? "text-ivory/75" : "text-stone")}>{item.text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

function StatsBlock({ b, ctx }: { b: Of<"stats">; ctx: Ctx }) {
  return (
    <Section tone={b.tone} aria-label="Key figures" id={ctx.id}>
      <Container size="wide">
        <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {b.items.map((s, i) => (
            <Reveal key={`${i}-${s.label}`} delay={i * 80} className="flex flex-col gap-1">
              <dt className={cn("text-sm", b.tone === "dark" ? "text-ivory/70" : "text-stone")}>{s.label}</dt>
              <dd className="order-first font-heading text-h1 font-light">{s.value}</dd>
            </Reveal>
          ))}
        </dl>
      </Container>
    </Section>
  );
}

function FaqBlock({ b, ctx }: { b: Of<"faq">; ctx: Ctx }) {
  const dark = b.tone === "dark";
  return (
    <Section tone={b.tone} aria-labelledby={`${ctx.id}-heading`}>
      <JsonLd data={faqSchema(b.items)} />
      <Container size="wide" className="grid gap-12 md:grid-cols-12 md:gap-8">
        <Reveal className="stack md:col-span-4">
          <Eyebrow>Questions</Eyebrow>
          <Heading level={ctx.level} id={`${ctx.id}-heading`}>
            <Accent text={b.heading} />
          </Heading>
        </Reveal>
        <Reveal delay={100} className="md:col-span-7 md:col-start-6">
          <div className={cn("border-t", dark ? "border-ivory/15" : "border-line")}>
            {b.items.map((f, i) => (
              <details key={`${i}-${f.question}`} className={cn("group border-b", dark ? "border-ivory/15" : "border-line")} open={i === 0}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                  <span className="font-heading text-h4">{f.question}</span>
                  <Plus aria-hidden className={cn("mt-1 size-5 shrink-0 transition-transform duration-300 group-open:rotate-45", dark ? "text-sand" : "text-bronze")} />
                </summary>
                <p className={cn("max-w-2xl pb-7 whitespace-pre-line", dark ? "text-ivory/80" : "text-stone")}>{f.answer}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

async function ProceduresBlock({ b, ctx }: { b: Of<"procedures">; ctx: Ctx }) {
  const all = await getProcedures();
  const chosen = b.slugs.map((s) => all.find((p) => p.slug === s)).filter((p) => p != null);
  if (chosen.length === 0) return null;
  return (
    <Section tone={b.tone} aria-labelledby={`${ctx.id}-heading`}>
      <Container size="wide">
        <Reveal className="section-intro">
          <Heading level={ctx.level} id={`${ctx.id}-heading`}>
            <Accent text={b.heading} />
          </Heading>
        </Reveal>
        <ul className="grid-auto gap-x-8 gap-y-14">
          {chosen.map((p, i) => (
            <li key={p.slug}>
              <Reveal delay={i * 60}>
                <ProcedureCard p={p} headingLevel={ctx.level === 1 ? 2 : 3} />
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

function CtaBlock({ b, ctx }: { b: Of<"cta">; ctx: Ctx }) {
  return (
    <section aria-labelledby={`${ctx.id}-heading`} className="grain section-y bg-ink text-ivory">
      <Container size="wide" className="grid gap-8 md:grid-cols-12 md:items-end">
        <Reveal className="stack md:col-span-7">
          <Heading level={ctx.level} id={`${ctx.id}-heading`}>
            <Accent text={b.heading} />
          </Heading>
          {b.intro && <p className="max-w-lg text-ivory/75">{b.intro}</p>}
        </Reveal>
        <div className="md:col-span-4 md:col-start-9 md:justify-self-end">
          <ButtonLink size="cta-lg" className="bg-ivory text-ink hover:bg-white" href={b.button.href}>
            {b.button.label} <ArrowRight />
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
