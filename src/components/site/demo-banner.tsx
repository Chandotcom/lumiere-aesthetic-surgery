import { site } from "@/lib/site";

export function DemoBanner() {
  if (!site.isDemo) return null;
  return (
    <div
      role="note"
      className="bg-foreground px-4 py-1.5 text-center text-xs text-background"
    >
      DEMO — {site.name} is a fictional practice. Content is illustrative, not medical advice.
    </div>
  );
}
