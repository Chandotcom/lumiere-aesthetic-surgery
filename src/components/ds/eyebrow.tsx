import { cn } from "@/lib/utils";

/** Small uppercase tracked label above headings. */
export function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("eyebrow", className)} {...props} />;
}
