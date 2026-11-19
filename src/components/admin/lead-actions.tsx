"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  assignLeadToMe,
  markLeadResponded,
  saveLeadNotes,
  updateLeadStatus,
} from "@/app/admin/leads/actions";
import type { ActionResult } from "@/lib/admin/action";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { leadStatusLabel, type LeadStatus } from "@/lib/admin/lead-status";

type Props = {
  leadId: number;
  status: LeadStatus;
  notes: string;
  responded: boolean;
  assignedToMe: boolean;
  assignedToOther: boolean;
};

const statuses = Object.keys(leadStatusLabel) as LeadStatus[];

export function LeadActions({ leadId, status, notes, responded, assignedToMe, assignedToOther }: Props) {
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState(notes);

  function run(action: () => Promise<ActionResult>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(success);
      else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="lead-status">Status</Label>
        <select
          id="lead-status"
          value={status}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value as LeadStatus;
            run(() => updateLeadStatus(leadId, next), `Status set to ${leadStatusLabel[next]}`);
          }}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {leadStatusLabel[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {!responded && (
          <Button
            disabled={pending}
            onClick={() => run(() => markLeadResponded(leadId), "Marked as responded")}
          >
            Mark responded
          </Button>
        )}
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            run(
              () => assignLeadToMe(leadId, !assignedToMe),
              assignedToMe ? "Unassigned" : "Assigned to you",
            )
          }
        >
          {assignedToMe ? "Unassign me" : assignedToOther ? "Reassign to me" : "Assign to me"}
        </Button>
      </div>

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => saveLeadNotes(leadId, draft), "Notes saved");
        }}
      >
        <Label htmlFor="lead-notes">Internal notes</Label>
        <Textarea
          id="lead-notes"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={5000}
          rows={6}
          placeholder="Call outcomes, follow-up dates… Staff only, never shown to the patient."
        />
        <Button type="submit" variant="outline" disabled={pending || draft === notes}>
          Save notes
        </Button>
      </form>
    </div>
  );
}
