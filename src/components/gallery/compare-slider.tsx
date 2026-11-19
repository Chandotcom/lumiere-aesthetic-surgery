"use client";

import { useId, useState } from "react";
import { ChevronsLeftRight } from "lucide-react";

/**
 * Before/after comparison. A native range input sits over the image, so it works with
 * mouse, touch and keyboard (arrow keys) and is announced by screen readers.
 */
export function CompareSlider({
  before,
  after,
  label,
}: {
  before: React.ReactNode;
  after: React.ReactNode;
  /** e.g. "Rhinoplasty, case 1042" */
  label: string;
}) {
  const [pos, setPos] = useState(50);
  const id = useId();

  return (
    <div className="group/compare relative aspect-[4/5] overflow-hidden bg-cream select-none">
      {/* Before (base layer) */}
      <div className="absolute inset-0">{before}</div>

      {/* After (revealed from the right) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }} aria-hidden>
        {after}
      </div>

      {/* Labels */}
      <span className="pointer-events-none absolute top-3 left-3 bg-ivory/90 px-2.5 py-1 text-[0.625rem] tracking-[0.18em] text-ink uppercase">
        Before
      </span>
      <span className="pointer-events-none absolute top-3 right-3 bg-ink/85 px-2.5 py-1 text-[0.625rem] tracking-[0.18em] text-ivory uppercase">
        After
      </span>

      {/* Handle */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-px bg-ivory shadow-[0_0_0_1px_rgb(29_27_24/0.08)]"
        style={{ left: `${pos}%` }}
      >
        <span className="absolute top-1/2 left-1/2 grid size-10 -translate-1/2 place-items-center rounded-full bg-ivory text-ink shadow-[0_8px_24px_-8px_rgb(29_27_24/0.45)] transition-transform group-has-[input:focus-visible]/compare:scale-110 group-has-[input:focus-visible]/compare:outline-2 group-has-[input:focus-visible]/compare:outline-bronze">
          <ChevronsLeftRight className="size-4" />
        </span>
      </div>

      <label htmlFor={id} className="sr-only">
        Compare before and after: {label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-valuetext={`${100 - pos}% after image shown`}
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
