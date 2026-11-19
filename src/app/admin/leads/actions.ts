"use server";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { runStaffAction, type ActionResult } from "@/lib/admin/action";
import { logAudit } from "@/lib/admin/audit";
import { leadStatuses } from "@/lib/admin/lead-status";

const { leads } = schema;

const leadId = z.coerce.number().int().positive();

const run = (fn: (staffId: string) => Promise<void>) => runStaffAction("leads", fn);

/** Change a lead's pipeline status. Leaving "new" also counts as the first response. */
export async function updateLeadStatus(id: number, status: string): Promise<ActionResult> {
  const parsed = z.object({ id: leadId, status: z.enum(leadStatuses) }).safeParse({ id, status });
  if (!parsed.success) return { ok: false, error: "Invalid status." };
  const d = parsed.data;

  return run(async (staffId) => {
    const db = getDb();
    await db.update(leads).set({ status: d.status }).where(eq(leads.id, d.id));
    if (d.status !== "new") {
      await db
        .update(leads)
        .set({ firstRespondedAt: new Date() })
        .where(and(eq(leads.id, d.id), isNull(leads.firstRespondedAt)));
    }
    await logAudit(staffId, `lead.status_changed:${d.status}`, "lead", d.id);
  });
}

/** Stop the waiting timer without changing status (e.g. replied but no booking yet). */
export async function markLeadResponded(id: number): Promise<ActionResult> {
  const parsed = leadId.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid lead." };

  return run(async (staffId) => {
    await getDb()
      .update(leads)
      .set({ firstRespondedAt: new Date() })
      .where(and(eq(leads.id, parsed.data), isNull(leads.firstRespondedAt)));
    await logAudit(staffId, "lead.responded", "lead", parsed.data);
  });
}

/** Internal staff notes. The audit log records that notes changed, not their text. */
export async function saveLeadNotes(id: number, notes: string): Promise<ActionResult> {
  const parsed = z
    .object({ id: leadId, notes: z.string().trim().max(5000, "Notes are limited to 5,000 characters.") })
    .safeParse({ id, notes });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid notes." };
  const d = parsed.data;

  return run(async (staffId) => {
    await getDb().update(leads).set({ notes: d.notes || null }).where(eq(leads.id, d.id));
    await logAudit(staffId, "lead.notes_updated", "lead", d.id);
  });
}

/** Assign the lead to yourself, or clear the assignment. */
export async function assignLeadToMe(id: number, assign: boolean): Promise<ActionResult> {
  const parsed = leadId.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid lead." };

  return run(async (staffId) => {
    await getDb()
      .update(leads)
      .set({ assignedTo: assign ? staffId : null })
      .where(eq(leads.id, parsed.data));
    await logAudit(staffId, assign ? "lead.assigned" : "lead.unassigned", "lead", parsed.data);
  });
}
