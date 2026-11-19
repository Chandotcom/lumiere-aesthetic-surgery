"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteReview, setReviewStatus } from "@/app/admin/reviews/actions";
import { selectClass } from "@/components/admin/gallery/case-details-form";
import { GalleryStatusBadge as StatusBadge } from "@/components/admin/gallery/gallery-status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/admin/action";
import { hideReasons, type HideReason, type ReviewStatus } from "@/lib/reviews/meta";

/** Publish / unpublish / hide (with a policy reason) / delete. */
export function ReviewStatusPanel({
  reviewId,
  status,
  hiddenReason,
  canDelete,
}: {
  reviewId: number;
  status: ReviewStatus;
  hiddenReason: string | null;
  canDelete: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [hiding, setHiding] = useState(false);
  const [reason, setReason] = useState<HideReason | "">("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function run(action: () => Promise<ActionResult>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(success);
        setHiding(false);
      } else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <StatusBadge status={status} />
      {status === "hidden" && hiddenReason && hiddenReason in hideReasons && (
        <p className="text-sm text-stone">Reason: {hideReasons[hiddenReason as HideReason]}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {status !== "approved" ? (
          <Button disabled={pending} onClick={() => run(() => setReviewStatus(reviewId, "approved"), "Review published")}>
            Publish review
          </Button>
        ) : (
          <Button variant="outline" disabled={pending} onClick={() => run(() => setReviewStatus(reviewId, "pending"), "Moved back to review")}>
            Unpublish
          </Button>
        )}
        {status !== "hidden" && !hiding && (
          <Button variant="outline" disabled={pending} onClick={() => setHiding(true)}>
            Hide…
          </Button>
        )}
      </div>

      {hiding && (
        <div className="space-y-3 rounded-sm border border-line p-3">
          <div className="space-y-1.5">
            <Label htmlFor="hide-reason">Why are you hiding it?</Label>
            <select
              id="hide-reason"
              className={selectClass}
              value={reason}
              onChange={(e) => setReason(e.target.value as HideReason | "")}
            >
              <option value="">Choose a reason…</option>
              {Object.entries(hideReasons).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-stone">A low rating is never a reason to hide a review.</p>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={pending || !reason}
              onClick={() => reason && run(() => setReviewStatus(reviewId, "hidden", reason), "Review hidden")}
            >
              Hide review
            </Button>
            <Button variant="ghost" disabled={pending} onClick={() => setHiding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="border-t border-line pt-4">
        {!canDelete ? (
          <p className="text-xs text-stone">Published reviews can’t be deleted. Hide them with a reason instead.</p>
        ) : confirmDelete ? (
          <div className="space-y-2">
            <p className="text-sm text-stone">Delete this review permanently?</p>
            <div className="flex gap-2">
              <Button variant="destructive" disabled={pending} onClick={() => run(() => deleteReview(reviewId), "Review deleted")}>
                Delete permanently
              </Button>
              <Button variant="ghost" disabled={pending} onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="text-destructive" disabled={pending} onClick={() => setConfirmDelete(true)}>
            Delete review…
          </Button>
        )}
      </div>
    </div>
  );
}
