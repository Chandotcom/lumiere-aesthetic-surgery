import "server-only";
import { and, asc, count, desc, eq, gte, lt, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { leadScope } from "./lead-scope";
import type { AppointmentStatus, AppointmentType } from "./appointment-meta";

export * from "./appointment-meta";

const { appointments, leads } = schema;

// Compile-time check: the shared lists match the database enums exactly.
type Same<A, B> = [A, B] extends [B, A] ? true : never;
const _typesMatch: Same<AppointmentType, (typeof schema.appointmentType.enumValues)[number]> = true;
const _statusesMatch: Same<AppointmentStatus, (typeof schema.appointmentStatus.enumValues)[number]> = true;
void _typesMatch;
void _statusesMatch;

export type AppointmentView = "upcoming" | "past";

export const APPOINTMENTS_LIMIT = 200;

/** Appointments with the patient's name. Upcoming: soonest first. Past: most recent first. */
export async function listAppointments({
  view,
  type,
  now,
}: {
  view: AppointmentView;
  type?: AppointmentType;
  now: Date;
}) {
  const filters: SQL[] = [view === "upcoming" ? gte(appointments.startsAt, now) : lt(appointments.startsAt, now)];
  if (type) filters.push(eq(appointments.type, type));
  const scope = await leadScope();
  if (scope) filters.push(scope);

  return getDb()
    .select({
      id: appointments.id,
      leadId: appointments.leadId,
      type: appointments.type,
      status: appointments.status,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
      depositPaid: appointments.depositPaid,
      depositAmount: appointments.depositAmount,
      leadName: leads.name,
      leadEmail: leads.email,
    })
    .from(appointments)
    .innerJoin(leads, eq(appointments.leadId, leads.id))
    .where(and(...filters))
    .orderBy(view === "upcoming" ? asc(appointments.startsAt) : desc(appointments.startsAt))
    .limit(APPOINTMENTS_LIMIT);
}

/** Past appointments still marked "scheduled": their outcome hasn't been recorded. */
export async function countMissingOutcomes(now: Date) {
  const [row] = await getDb()
    .select({ n: count() })
    .from(appointments)
    .innerJoin(leads, eq(appointments.leadId, leads.id))
    .where(and(lt(appointments.startsAt, now), eq(appointments.status, "scheduled"), await leadScope()));
  return row?.n ?? 0;
}

export type AppointmentListItem = Awaited<ReturnType<typeof listAppointments>>[number];
