"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { restoreRevision } from "@/app/admin/content/actions";
import { Button } from "@/components/ui/button";

/** Published versions, newest first. Restoring loads a version into the draft for review. */
export function RevisionList({
  kind,
  contentKey,
  revisions,
}: {
  kind: string;
  contentKey: string;
  revisions: { id: number; label: string }[];
}) {
  const [pending, startTransition] = useTransition();
  if (revisions.length === 0) {
    return <p className="text-sm text-stone">No published versions yet.</p>;
  }
  return (
    <ol className="divide-y divide-line rounded-sm border border-line text-sm">
      {revisions.map((r, i) => (
        <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2">
          <span>
            {r.label}
            {i === 0 && <span className="ml-2 text-xs text-stone">(latest)</span>}
          </span>
          <Button
            size="xs"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await restoreRevision(kind, contentKey, r.id);
                if (res.ok) toast.success("Version loaded into the draft. Review it, then publish.");
                else toast.error(res.error);
              })
            }
          >
            Restore
          </Button>
        </li>
      ))}
    </ol>
  );
}
