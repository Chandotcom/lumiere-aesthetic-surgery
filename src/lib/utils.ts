import { createCn } from "cn/config";

/**
 * Class merger that knows our custom design tokens (see globals.css @theme).
 * Without this, `text-label` / `text-h2` are treated as text *colors* and silently
 * remove real colors like `text-primary-foreground` when merged.
 * Always import `cn` from here, not from the "cn" package directly.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "h1", "h2", "h3", "h4", "lead", "label"] }],
      tracking: [{ tracking: ["label"] }],
      ease: [{ ease: ["luxe"] }],
    },
  },
});
