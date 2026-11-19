import Link from "next/link";
import { cn } from "@/lib/utils";

/** Inline accent link with the animated hairline underline. */
export function TextLink({ className, ...props }: React.ComponentProps<typeof Link>) {
  return <Link className={cn("link-underline", className)} {...props} />;
}
