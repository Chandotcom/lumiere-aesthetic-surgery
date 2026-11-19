"use client";

import { useState, useTransition } from "react";
import { CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { deleteCase, setCaseStatus } from "@/app/admin/gallery/actions";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/admin/action";
import type { GalleryStatus } from "@/lib/gallery/meta";
import { GalleryStatusBadge } from "./gallery-status-badge";

/** Publish / unpublish / hide / delete, with the reasons a case can't be published yet. */
export function CaseStatusPanel({
  caseId,
  status,
  blockers,
  publicPath,
}: {
  caseId: number;
  status: GalleryStatus;
  blockers: string[];
  publicPath: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function run(action: () => Promise<ActionResult>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(success);
      else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <GalleryStatusBadge status={status} />
        {status === "approved" && (
          <a href={publicPath} target="_blank" rel="noopener" className="text-sm text-bronze hover:underline">
            View on site<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </div>

      {status !== "approved" && blockers.length > 0 && (
        <div className="space-y-2 rounded-sm border border-line bg-cream/60 p-3 text-sm">
          <p className="flex items-center gap-1.5 font-medium text-ink">
            <CircleAlert className="size-4 text-bronze" aria-hidden /> Before you can publish
          </p>
          <ul id="publish-blockers" className="list-disc space-y-1 pl-5 text-stone">
            {blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {status !== "approved" ? (
          <Button
            disabled={pending || blockers.length > 0}
            aria-describedby={blockers.length ? "publish-blockers" : undefined}
            onClick={() => run(() => setCaseStatus(caseId, "approved"), "Case published")}
          >
            Publish case
          </Button>
        ) : (
          <Button variant="outline" disabled={pending} onClick={() => run(() => setCaseStatus(caseId, "pending"), "Moved back to review")}>
            Unpublish
          </Button>
        )}
        {status !== "hidden" && (
          <Button variant="outline" disabled={pending} onClick={() => run(() => setCaseStatus(caseId, "hidden"), "Case hidden")}>
            Hide
          </Button>
        )}
        {status === "hidden" && (
          <Button variant="outline" disabled={pending} onClick={() => run(() => setCaseStatus(caseId, "pending"), "Moved back to review")}>
            Back to review
          </Button>
        )}
      </div>

      <div className="border-t border-line pt-4">
        {confirmDelete ? (
          <div className="space-y-2">
            <p className="text-sm text-stone">Delete this case and its photo files permanently? This can’t be undone.</p>
            <div className="flex gap-2">
              <Button variant="destructive" disabled={pending} onClick={() => run(() => deleteCase(caseId), "Case deleted")}>
                Delete permanently
              </Button>
              <Button variant="ghost" disabled={pending} onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="text-destructive" disabled={pending} onClick={() => setConfirmDelete(true)}>
            Delete case…
          </Button>
        )}
      </div>
    </div>
  );
}
