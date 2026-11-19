"use client";

import { useState } from "react";
import type { GalleryCase, View } from "@/lib/content/gallery";
import type { Category } from "@/lib/content/procedures";
import { cn } from "@/lib/utils";
import { CompareSlider } from "./compare-slider";
import { CasePhoto } from "./case-photo";

/** Large comparison slider with a switcher for each photo angle (Front / Profile / Oblique). */
export function CaseViewer({
  category,
  views,
  label,
  photos,
}: {
  category: Category;
  views: View[];
  label: string;
  photos?: GalleryCase["photos"];
}) {
  const [active, setActive] = useState(0);
  const view = views[active];
  const pair = photos?.[view];
  const sizes = "(min-width: 840px) 42rem, 100vw";

  return (
    // Width capped from viewport height so the whole 4:5 comparison is visible without scrolling
    <div className="mx-auto w-full max-w-md md:w-[min(42rem,55vw,calc((100svh-var(--header-h)-7rem)*0.8))] md:max-w-none">
      {/* key resets the slider to 50% when switching angle */}
      <CompareSlider
        key={view}
        label={`${label}, ${view.toLowerCase()} view`}
        before={<CasePhoto src={pair?.before} alt={`${label}, ${view.toLowerCase()} view, before`} category={category} variant="before" sizes={sizes} />}
        after={<CasePhoto src={pair?.after} alt={`${label}, ${view.toLowerCase()} view, after`} category={category} variant="after" sizes={sizes} />}
      />

      {views.length > 1 && (
        <div role="group" aria-label="Photo angle" className="mt-4 flex gap-2">
          {views.map((v, i) => (
            <button
              key={v}
              type="button"
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "h-10 rounded-full border px-5 text-xs tracking-wide uppercase transition-colors",
                i === active
                  ? "border-ink bg-ink text-ivory"
                  : "border-input bg-white text-stone hover:border-stone/60 hover:text-ink",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-stone">Drag the handle, or focus it and use your arrow keys, to compare.</p>
    </div>
  );
}
