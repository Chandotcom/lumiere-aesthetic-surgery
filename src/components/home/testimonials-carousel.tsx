"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Container, Eyebrow, Heading } from "@/components/ds";
import type { HomeContent } from "@/lib/cms/schemas";
import { cn } from "@/lib/utils";

/** One large quote at a time, cross-fading. Manual controls only (no auto-advance: WCAG 2.2.2). */
export function TestimonialsCarousel({
  testimonials,
  heading,
}: {
  testimonials: HomeContent["testimonials"]["items"];
  heading: React.ReactNode;
}) {
  const [i, setI] = useState(0);
  const n = testimonials.length;
  const go = (d: number) => setI((v) => (v + d + n) % n);

  return (
    <section aria-labelledby="reviews-heading" aria-roledescription="carousel" className="section-y bg-ivory">
      <Container size="wide">
        <div className="section-intro flex items-end justify-between gap-6">
          <div className="stack">
            <Eyebrow>Patient stories</Eyebrow>
            <Heading level={2} id="reviews-heading">
              {heading}
            </Heading>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous review"
              className="grid size-12 place-items-center border border-ink/30 text-ink transition-colors hover:bg-ink hover:text-ivory"
            >
              <ArrowLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next review"
              className="grid size-12 place-items-center border border-ink/30 text-ink transition-colors hover:bg-ink hover:text-ivory"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="relative aspect-[4/5] overflow-hidden md:col-span-4">
            {testimonials.map((t, k) => (
              <Image
                key={`${k}-${t.name}`}
                src={t.image.src}
                alt={k === i ? t.image.alt : ""}
                fill
                sizes="(min-width: 840px) 30vw, 100vw"
                className={cn(
                  "object-cover transition-[opacity,transform] duration-1000 ease-luxe",
                  k === i ? "scale-100 opacity-100" : "scale-105 opacity-0",
                )}
              />
            ))}
          </div>

          <div className="grid md:col-span-7 md:col-start-6" aria-live="polite">
            {testimonials.map((t, k) => (
              <figure
                key={`${k}-${t.name}`}
                aria-hidden={k !== i}
                className={cn(
                  "col-start-1 row-start-1 flex flex-col justify-between gap-10 transition-[opacity,transform] duration-700 ease-luxe",
                  k === i ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
                )}
              >
                <div className="stack">
                  <span aria-hidden className="font-heading text-[6rem] leading-none text-sand md:text-[8rem]">
                    “
                  </span>
                  <blockquote className="-mt-10 font-heading text-h2 leading-[1.2] font-light text-ink md:-mt-16">
                    {t.quote}
                  </blockquote>
                </div>
                <figcaption className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                  <span>
                    <span className="block font-medium text-ink">{t.name}</span>
                    <span className="text-sm text-stone">{t.procedure} patient</span>
                  </span>
                  <span className="flex items-center gap-4 text-sm text-stone">
                    <span className="tracking-[0.2em] text-bronze" aria-label="5 out of 5 stars">
                      ★★★★★
                    </span>
                    <span className="numeral">
                      {String(k + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <p className="mt-10 text-xs text-stone">
          Sample reviews for this demo practice. Reviews are never filtered or edited; individual
          results vary.
        </p>
      </Container>
    </section>
  );
}
