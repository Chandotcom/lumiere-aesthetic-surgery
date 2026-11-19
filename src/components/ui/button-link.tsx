import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A navigation link that looks like a button.
 * Use this instead of `<Button render={<Link />}>`: Base UI's Button expects a native
 * <button>, and forcing it onto a link adds role="button" (wrong for screen readers/SEO).
 */
export function ButtonLink({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return (
    <Link
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
