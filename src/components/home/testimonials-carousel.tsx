"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Container, Eyebrow, Heading } from "@/components/ds";
import type { PublicReview } from "@/lib/reviews/meta";
import { cn } from "@/lib/utils";

/** One large quote at a time, cross-fading. Manual controls only (no auto-advance: WCAG 2.2.2). */
export function TestimonialsCarousel({ reviews, heading }: { reviews: PublicReview[]; heading: React.ReactNode }) {
  const [i, setI] = useState(0);
  const n = reviews.length;
  const anySample = reviews.some((r) => r.isSample);
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
          <div className={cn("flex gap-2", n < 2 && "hidden")}>
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
            {reviews.map((t, k) => {
              const fade = cn(
                "transition-[opacity,transform] duration-1000 ease-luxe",
                k === i ? "scale-100 opacity-100" : "scale-105 opacity-0",
              );
              return t.image ? (
                <Image
                  key={t.id}
                  src={t.image.src}
                  alt={k === i ? t.image.alt : ""}
                  fill
                  sizes="(min-width: 840px) 30vw, 100vw"
                  className={cn("object-cover", fade)}
                />
              ) : (
                // No photo: a quiet monogram panel in the same frame
                <div key={t.id} aria-hidden className={cn("absolute inset-0 grid place-items-center bg-cream", fade)}>
                  <span className="font-heading text-[7rem] font-light text-bronze/70">{t.name.charAt(0)}</span>
                </div>
              );
            })}
          </div>

          <div className="grid md:col-span-7 md:col-start-6" aria-live="polite">
            {reviews.map((t, k) => (
              <figure
                key={t.id}
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
                    <span className="text-sm text-stone">
                      {t.procedure ? `${t.procedure} patient` : "Patient"}
                      {t.isSample && " · Sample review"}
                    </span>
                  </span>
                  <span className="flex items-center gap-4 text-sm text-stone">
                    <span className="tracking-[0.2em]" role="img" aria-label={`${t.rating} out of 5 stars`}>
                      <span className="text-bronze">{"★".repeat(t.rating)}</span>
                      <span className="text-line">{"★".repeat(5 - t.rating)}</span>
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
          {anySample && "Sample reviews for this demo practice. "}
          We publish reviews whatever their rating and never edit them. We only remove reviews that share
          personal health details, aren’t from a patient, or that the patient asks us to take down.
          Individual results vary.
        </p>
      </Container>
    </section>
  );
}
