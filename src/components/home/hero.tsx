import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Eyebrow, Heading } from "@/components/ds";
import { Accent } from "@/components/ds/accent";
import { getHomeContent } from "@/lib/cms/home";
import { serviceGroups } from "@/lib/content/home";

// CSS-only entrance (tw-animate-css) — the hero must not wait for JS (LCP).
const enter = "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:duration-1000 motion-safe:fill-mode-both motion-safe:ease-out";

/**
 * Editorial split hero. The portrait sits in its own 4:5 frame (matching the photo)
 * so the face is never cropped. Phones: copy + CTAs first, full portrait below.
 */
export async function Hero() {
  const { hero } = await getHomeContent();
  return (
    <section className="relative overflow-hidden bg-ivory">
      <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[36%] bg-cream md:block" />

      <div className="container-wide media-pair relative grid items-center gap-16 pt-12 pb-20 md:gap-x-16 md:py-20 lg:gap-x-20 lg:py-24">
        <div className="stack">
          <Eyebrow className={enter}>{hero.eyebrow}</Eyebrow>
          <Heading level={1} size="display" className={`text-ink ${enter} delay-100`}>
            <Accent text={hero.heading} />
          </Heading>
          <p className={`lead max-w-[32rem] text-balance ${enter} delay-200`}>
            {hero.intro}
          </p>
          <div data-slot="actions" className={`flex flex-col gap-3 sm:flex-row ${enter} delay-300`}>
            <ButtonLink size="cta-lg" href="/consultation">
              Request a consultation <ArrowRight />
            </ButtonLink>
            <ButtonLink size="cta-lg" variant="outline" href="/gallery">
              View results
            </ButtonLink>
          </div>
          <p className={`mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-6 text-sm text-stone ${enter} delay-500`}>
            <span className="tracking-[0.2em] text-bronze" aria-hidden>
              ★★★★★
            </span>
            {hero.trustLine}
          </p>
        </div>

        <div className={`media-pair-img relative mx-auto max-w-md max-md:w-full md:mx-0 md:max-w-none ${enter} delay-200`}>
          <div aria-hidden className="absolute -bottom-6 -left-6 hidden h-3/4 w-3/4 bg-sand/45 md:block" />
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <Image
              src={hero.image.src}
              alt={hero.image.alt}
              fill
              preload
              sizes="(min-width: 1024px) 40vw, (min-width: 840px) 50vw, 28rem"
              className="object-cover object-[50%_30%] motion-safe:animate-in motion-safe:zoom-in-105 motion-safe:duration-[2s]"
            />
          </div>
          <div className="absolute right-4 -bottom-6 flex items-center gap-3 bg-ivory px-5 py-4 shadow-[0_12px_40px_-12px_rgb(29_27_24/0.25)] md:right-auto md:bottom-10 md:-left-10">
            <ShieldCheck className="size-6 shrink-0 text-bronze" aria-hidden />
            <div className="leading-tight">
              <p className="text-sm font-medium text-ink">{hero.badgeTitle}</p>
              <p className="text-xs text-stone">{hero.badgeText}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category index row */}
      <nav aria-label="Procedure categories" className="relative border-y border-line bg-ivory">
        <ul className="container-wide grid grid-cols-2 md:grid-cols-4">
          {serviceGroups.map((g, i) => (
            <li
              // Padding lives on the <li> so :first-child / :nth-child refer to grid position
              key={g.category}
              className="border-line pr-4 max-md:odd:border-r max-md:even:pl-4 max-md:[&:nth-child(-n+2)]:border-b md:px-6 md:first:pl-0 md:last:pr-0 md:not-last:border-r"
            >
              <Link
                href={g.href}
                className="group flex items-center justify-between gap-3 py-5 text-ink transition-colors hover:text-bronze"
              >
                <span className="flex items-baseline gap-3">
                  <span className="numeral text-xs text-stone">0{i + 1}</span>
                  <span className="text-label tracking-label uppercase">{g.category}</span>
                </span>
                <ArrowRight
                  aria-hidden
                  className="size-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
