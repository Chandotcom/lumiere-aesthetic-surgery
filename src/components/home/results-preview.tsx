"use client";

import Link from "next/link";
import { ArrowRight, EyeOff } from "lucide-react";
import { CompareSlider } from "@/components/gallery/compare-slider";
import { CasePhoto } from "@/components/gallery/case-photo";
import { useAgeConfirmed } from "@/components/gallery/age-gate";
import type { CasePhotoPair } from "@/lib/content/gallery";
import type { Category } from "@/lib/content/procedures";

type Featured = {
  slug: string;
  number: number;
  category: Category;
  procedureName: string;
  notes: string;
  ageRange: string;
  timeAfter: string;
  photo?: CasePhotoPair;
};

/**
 * Homepage before/after preview. Locked until the visitor confirms 18+ (same session
 * confirmation as the gallery), then shows one featured case with the comparison slider.
 */
export function ResultsPreview({ featured }: { featured: Featured }) {
  const { confirmed, confirm } = useAgeConfirmed();

  return (
    // Width comes from the parent (media-pair-img), capped by viewport height so it fits on screen
    <div className="mx-auto w-full max-w-md md:max-w-none">
      <div aria-live="polite">
        {confirmed ? (
          <CompareSlider
            label={`${featured.procedureName}, case ${featured.number}`}
            before={
              <CasePhoto src={featured.photo?.before} alt={`${featured.procedureName}, case ${featured.number}, before`} category={featured.category} variant="before" sizes="(min-width: 840px) 40vw, 100vw" />
            }
            after={
              <CasePhoto src={featured.photo?.after} alt={`${featured.procedureName}, case ${featured.number}, after`} category={featured.category} variant="after" sizes="(min-width: 840px) 40vw, 100vw" />
            }
          />
        ) : (
          <div className="relative aspect-[4/5] overflow-hidden">
            {/* Locked state: no images are rendered at all */}
            <div aria-hidden className="absolute inset-0 grid grid-cols-2 gap-px bg-ivory/15">
              {["Before", "After"].map((label) => (
                <div key={label} className="relative bg-gradient-to-b from-stone/50 to-ink">
                  <span className="absolute top-3 left-3 text-[0.625rem] tracking-[0.18em] text-ivory/70 uppercase">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 grid place-items-center p-6">
              <div className="stack max-w-[17rem] items-center gap-4! text-center">
                <span className="grid size-12 place-items-center rounded-full border border-sand/40 text-sand">
                  <EyeOff className="size-5" aria-hidden />
                </span>
                <p className="text-sm text-ivory/80">
                  Results may include nudity. Please confirm you are 18 or older to view.
                </p>
                <button
                  type="button"
                  onClick={confirm}
                  className="inline-flex h-11 items-center justify-center rounded-sm bg-ivory px-6 text-label tracking-label text-ink uppercase transition-colors hover:bg-white"
                >
                  I am 18+ — show results
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {confirmed ? (
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-heading text-h4 text-ivory">{featured.procedureName}</p>
            <p className="mt-1 text-sm text-ivory/65">
              {featured.notes} · Age {featured.ageRange} · {featured.timeAfter} after
            </p>
          </div>
          <Link
            href={`/gallery/${featured.slug}`}
            className="inline-flex shrink-0 items-center gap-1 text-sm text-sand transition-colors hover:text-ivory"
          >
            View case <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      ) : (
        <p className="mt-4 text-xs text-ivory/50">
          Gallery images contain nudity and are shown only after age confirmation.
        </p>
      )}
    </div>
  );
}
