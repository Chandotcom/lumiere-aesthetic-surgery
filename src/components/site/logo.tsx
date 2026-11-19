import Link from "next/link";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex shrink-0 flex-col leading-none whitespace-nowrap", className)}>
      <span className="font-heading text-2xl font-light tracking-[0.28em] uppercase">
        {site.shortName}
      </span>
      <span className="mt-1 text-[0.625rem] tracking-label uppercase opacity-70">
        Aesthetic Surgery
      </span>
      <span className="sr-only">{site.name} home</span>
    </Link>
  );
}
