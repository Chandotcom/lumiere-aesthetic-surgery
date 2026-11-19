import { cn } from "@/lib/utils";

const sizes = {
  site: "container-site", // 1200px content
  wide: "container-wide", // 1600px hero / galleries
  prose: "container-prose", // ~672px long-form reading
} as const;

export function Container({
  size = "site",
  className,
  ...props
}: React.ComponentProps<"div"> & { size?: keyof typeof sizes }) {
  return <div className={cn(sizes[size], className)} {...props} />;
}
