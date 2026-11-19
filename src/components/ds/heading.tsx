import { cn } from "@/lib/utils";

const sizes = {
  display: "text-display font-light",
  h1: "text-h1 font-light",
  h2: "text-h2 font-light",
  h3: "text-h3",
  h4: "text-h4",
} as const;

type Level = 1 | 2 | 3 | 4;

/**
 * Semantic level and visual size are decoupled, so a page can keep a correct
 * h1→h2→h3 outline (SEO / screen readers) while choosing any size.
 */
export function Heading({
  level = 2,
  size,
  className,
  ...props
}: React.ComponentProps<"h2"> & { level?: Level; size?: keyof typeof sizes }) {
  const Tag = `h${level}` as const;
  const visual = size ?? (`h${level}` as keyof typeof sizes);
  return <Tag className={cn("font-heading", sizes[visual], className)} {...props} />;
}
