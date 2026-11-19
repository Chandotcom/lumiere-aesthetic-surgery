import { formatDuration } from "@/lib/admin/format";
import type { Lead } from "@/lib/admin/leads";
import { cn } from "@/lib/utils";

/** A lead with no first response after this long is flagged as overdue. */
const OVERDUE_MS = 24 * 60 * 60 * 1000;

/** "Waiting 3h 12m" until someone responds, then "Replied in 45m". `now` comes from the data loader. */
export function ResponseTime({
  lead,
  now,
}: {
  lead: Pick<Lead, "createdAt" | "firstRespondedAt">;
  now: number;
}) {
  if (lead.firstRespondedAt) {
    return (
      <span className="text-stone">
        Replied in {formatDuration(lead.firstRespondedAt.getTime() - lead.createdAt.getTime())}
      </span>
    );
  }
  const waiting = now - lead.createdAt.getTime();
  const overdue = waiting > OVERDUE_MS;
  return (
    <span className={cn("font-medium", overdue ? "text-destructive" : "text-bronze")}>
      Waiting {formatDuration(waiting)}
      {overdue && <span className="sr-only"> (overdue)</span>}
    </span>
  );
}
