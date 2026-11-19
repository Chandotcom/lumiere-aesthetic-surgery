"use server";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { ActionError, runStaffAction, type ActionResult } from "@/lib/admin/action";
import { appointmentStatuses, appointmentTypes } from "@/lib/admin/appointment-meta";
import { logAudit } from "@/lib/admin/audit";
import { clinicTimeToDate } from "@/lib/admin/time";

const { appointments, leads } = schema;

const MIN = 60_000;
const YEAR = 365 * 24 * 60 * MIN;

const id = z.coerce.number().int().positive();

const slotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time."),
  durationMin: z.coerce.number().int().min(15, "At least 15 minutes.").max(600, "At most 10 hours."),
});

const bookSchema = slotSchema.extend({
  leadId: id,
  type: z.enum(appointmentTypes),
  depositPaid: z.boolean(),
  depositAmount: z.coerce.number().int().min(0).max(100_000).nullable(),
});

export type BookInput = z.input<typeof bookSchema>;
export type SlotInput = z.input<typeof slotSchema>;

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check the form.";
}

/** Clinic-time date + time → [start, end], rejecting impossible or far-off dates. */
function toRange(date: string, time: string, durationMin: number) {
  const start = clinicTimeToDate(date, time);
  if (!start) throw new ActionError("Choose a valid date and time.");
  const t = start.getTime();
  if (Math.abs(t - Date.now()) > 2 * YEAR) throw new ActionError("Choose a date within two years of today.");
  return [start, new Date(t + durationMin * MIN)] as const;
}

/**
 * Book an appointment for a lead. Also moves the lead along the pipeline: a consultation
 * makes a new/contacted lead "consult booked", and a surgery makes it "won". Booking counts
 * as the first response if nobody has responded yet.
 */
export async function bookAppointment(input: BookInput): Promise<ActionResult> {
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const d = parsed.data;

  return runStaffAction("appointments", async (staffId) => {
    const [startsAt, endsAt] = toRange(d.date, d.time, d.durationMin);
    const db = getDb();

    const [lead] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, d.leadId)).limit(1);
    if (!lead) throw new ActionError("This lead no longer exists.");

    const [created] = await db
      .insert(appointments)
      .values({
        leadId: d.leadId,
        type: d.type,
        startsAt,
        endsAt,
        depositPaid: d.type === "surgery" && d.depositPaid,
        depositAmount: d.type === "surgery" && d.depositPaid ? d.depositAmount : null,
      })
      .returning({ id: appointments.id });

    if (d.type === "consultation" || d.type === "virtual") {
      await db
        .update(leads)
        .set({ status: "consult_booked" })
        .where(and(eq(leads.id, d.leadId), inArray(leads.status, ["new", "contacted"])));
    } else if (d.type === "surgery") {
      await db.update(leads).set({ status: "won" }).where(eq(leads.id, d.leadId));
    }
    await db
      .update(leads)
      .set({ firstRespondedAt: new Date() })
      .where(and(eq(leads.id, d.leadId), isNull(leads.firstRespondedAt)));

    await logAudit(staffId, `appointment.booked:${d.type}`, "appointment", created?.id);
  });
}

/** Record the outcome (completed / no-show / cancelled), or set it back to scheduled. */
export async function updateAppointmentStatus(appointmentId: number, status: string): Promise<ActionResult> {
  const parsed = z.object({ id, status: z.enum(appointmentStatuses) }).safeParse({ id: appointmentId, status });
  if (!parsed.success) return { ok: false, error: "Invalid status." };
  const d = parsed.data;

  return runStaffAction("appointments", async (staffId) => {
    const updated = await getDb()
      .update(appointments)
      .set({ status: d.status })
      .where(eq(appointments.id, d.id))
      .returning({ id: appointments.id });
    if (!updated.length) throw new ActionError("This appointment no longer exists.");
    await logAudit(staffId, `appointment.status_changed:${d.status}`, "appointment", d.id);
  });
}

/** Move an appointment to a new slot. It goes back to "scheduled". */
export async function rescheduleAppointment(appointmentId: number, slot: SlotInput): Promise<ActionResult> {
  const parsed = slotSchema.extend({ id }).safeParse({ ...slot, id: appointmentId });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const d = parsed.data;

  return runStaffAction("appointments", async (staffId) => {
    const [startsAt, endsAt] = toRange(d.date, d.time, d.durationMin);
    const updated = await getDb()
      .update(appointments)
      .set({ startsAt, endsAt, status: "scheduled" })
      .where(eq(appointments.id, d.id))
      .returning({ id: appointments.id });
    if (!updated.length) throw new ActionError("This appointment no longer exists.");
    await logAudit(staffId, "appointment.rescheduled", "appointment", d.id);
  });
}
