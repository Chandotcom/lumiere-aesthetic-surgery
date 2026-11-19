import { Badge } from "@/components/ui/badge";
import { leadStatusLabel, type LeadStatus } from "@/lib/admin/lead-status";
import { cn } from "@/lib/utils";

const tone: Record<LeadStatus, string> = {
  new: "bg-bronze text-white",
  contacted: "bg-cream text-ink",
  consult_booked: "bg-sky-100 text-sky-900",
  won: "bg-emerald-100 text-emerald-900",
  lost: "bg-stone/10 text-stone",
};

/** Marks fictional demo leads (see `pnpm db:seed:demo`). */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-line text-stone", className)}>
      Sample
    </Badge>
  );
}

export function LeadStatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return <Badge className={cn(tone[status], className)}>{leadStatusLabel[status]}</Badge>;
}
