import type { CasePhotoPair } from "@/lib/content/gallery";
import type { Category } from "@/lib/content/procedures";
import { CasePhoto } from "./case-photo";

/**
 * Static side-by-side before/after thumbnail for grids. No interactivity, so a grid of
 * hundreds of cases stays light; the interactive slider lives on the case page.
 * Real photos are lazy-loaded; cases without photos show placeholder art.
 */
export function ThumbPair({ category, pair, label }: { category: Category; pair?: CasePhotoPair; label?: string }) {
  return (
    <div className="grid aspect-[8/5] grid-cols-2 gap-px overflow-hidden bg-line">
      {(["before", "after"] as const).map((v) => (
        <div key={v} className="relative">
          <CasePhoto
            src={pair?.[v]}
            alt={label ? `${label}, ${v}` : ""}
            category={category}
            variant={v}
            sizes="(min-width: 1280px) 16vw, (min-width: 480px) 25vw, 50vw"
            className={pair ? undefined : "[&>span]:hidden"}
          />
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
