import { PersonStanding, ScanFace, Sparkles, UserRound } from "lucide-react";
import type { Category } from "@/lib/content/procedures";
import { cn } from "@/lib/utils";

const icons = { Face: ScanFace, Breast: UserRound, Body: PersonStanding, "Non-surgical": Sparkles } as const;

/**
 * Stand-in for a clinical photo. Intentionally abstract and clearly labelled so it can never be
 * mistaken for a real patient result. Replace with consented Blob images from the admin.
 */
export function PlaceholderPhoto({
  category,
  variant,
  className,
}: {
  category: Category;
  variant: "before" | "after";
  className?: string;
}) {
  const Icon = icons[category];
  return (
    <div
      className={cn(
        "absolute inset-0 grid place-items-center",
        variant === "before"
          ? "bg-[linear-gradient(160deg,#e6e1da,#cfc8be)] text-stone/35"
          : "bg-[linear-gradient(160deg,#efe4d6,#d8c3a5)] text-bronze/40",
        className,
      )}
    >
      <Icon aria-hidden strokeWidth={0.75} className="size-2/5" />
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[0.625rem] tracking-[0.2em] whitespace-nowrap text-stone/70 uppercase">
        Placeholder image
      </span>
    </div>
  );
}
