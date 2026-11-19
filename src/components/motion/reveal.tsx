"use client";

import { useEffect, useRef } from "react";

type Props = {
  children: React.ReactNode;
  /** "up" = fade + rise (default), "fade" = opacity only, "image" = wipe from bottom, "content" = cell stays, children fade (hairline grids) */
  variant?: "up" | "fade" | "image" | "content";
  /** Delay in ms — use to stagger siblings */
  delay?: number;
  className?: string;
  as?: "div" | "li" | "figure" | "span";
};

/**
 * Reveals its children once when scrolled into view. All visual states live in
 * globals.css ([data-reveal]); with JS off or reduced motion, content is simply visible.
 */
export function Reveal({ children, variant = "up", delay = 0, className, as: Tag = "div" }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute("data-visible", "");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-reveal={variant}
      className={className}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
