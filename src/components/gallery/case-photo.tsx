import Image from "next/image";
import type { Category } from "@/lib/content/procedures";
import { cn } from "@/lib/utils";
import { PlaceholderPhoto } from "./placeholder-photo";

/**
 * One side of a before/after pair: the consented photo when the case has one, otherwise the
 * labelled placeholder art. Photos come from /api/gallery-image, which re-checks consent and
 * publication on every request, so they bypass the shared image optimizer (`unoptimized`).
 */
export function CasePhoto({
  src,
  alt,
  category,
  variant,
  sizes,
  className,
}: {
  src?: string;
  alt: string;
  category: Category;
  variant: "before" | "after";
  sizes: string;
  className?: string;
}) {
  if (!src) return <PlaceholderPhoto category={category} variant={variant} className={className} />;
  return <Image src={src} alt={alt} fill unoptimized sizes={sizes} className={cn("object-cover", className)} />;
}
