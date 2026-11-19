import { cn } from "@/lib/utils";

/**
 * Two-column text + media layout. Stacks (media first) below 840px (md),
 * sits side by side above it. `reverse` puts media on the left on desktop.
 */
export function Split({
  media,
  reverse = false,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { media: React.ReactNode; reverse?: boolean }) {
  return (
    <div
      className={cn("grid items-center gap-10 md:grid-cols-2 md:gap-16 lg:gap-24", className)}
      {...props}
    >
      <div className={cn("order-first", reverse ? "md:order-first" : "md:order-last")}>
        {media}
      </div>
      <div className="stack">{children}</div>
    </div>
  );
}
