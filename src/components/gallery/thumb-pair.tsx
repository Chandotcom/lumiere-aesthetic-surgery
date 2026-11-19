import type { Category } from "@/lib/content/procedures";
import { PlaceholderPhoto } from "./placeholder-photo";

/**
 * Static side-by-side before/after thumbnail for grids. No interactivity, so a grid of
 * hundreds of cases stays light; the interactive slider lives on the case page.
 * With real photos, use two next/image thumbnails here (lazy-loaded by default).
 */
export function ThumbPair({ category }: { category: Category }) {
  return (
    <div className="grid aspect-[8/5] grid-cols-2 gap-px overflow-hidden bg-line">
      {(["before", "after"] as const).map((v) => (
        <div key={v} className="relative">
          <PlaceholderPhoto category={category} variant={v} className="[&>span]:hidden" />
          <span
            className={
              v === "before"
                ? "absolute top-2.5 left-2.5 bg-ivory/90 px-2 py-0.5 text-[0.625rem] tracking-[0.18em] text-ink uppercase"
                : "absolute top-2.5 right-2.5 bg-ink/85 px-2 py-0.5 text-[0.625rem] tracking-[0.18em] text-ivory uppercase"
            }
          >
            {v}
          </span>
        </div>
      ))}
    </div>
  );
}
