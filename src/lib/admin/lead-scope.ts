import "server-only";
import { eq, isNull, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ActionError } from "./action";
import { isDemo } from "./roles";
import { getStaff, type Staff } from "./session";

const { leads, appointments } = schema;

/*
 * Demo accounts (prospects trying the admin) only see leads from the public consultation form:
 * the sample leads and their own test enquiries. Leads from custom forms, such as the outreach
 * questionnaire, can hold real clinics' details, so they stay hidden from them.
 */

/** Extra WHERE condition on `leads` for the signed-in account, or undefined for full access. */
export async function leadScope(): Promise<SQL | undefined> {
  const staff = await getStaff();
  return isDemo(staff?.role) ? isNull(leads.formSlug) : undefined;
}

/** In a demo-allowed action: refuse a lead the demo account can't see (same message as a missing one). */
export async function assertLeadInScope(staff: Staff, leadId: number) {
  if (!isDemo(staff.role)) return;
  const [row] = await getDb().select({ formSlug: leads.formSlug }).from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!row || row.formSlug !== null) throw new ActionError("This lead no longer exists.");
}

export async function assertAppointmentInScope(staff: Staff, appointmentId: number) {
  if (!isDemo(staff.role)) return;
  const [row] = await getDb()
    .select({ formSlug: leads.formSlug })
    .from(appointments)
    .innerJoin(leads, eq(appointments.leadId, leads.id))
    .where(eq(appointments.id, appointmentId))
    .limit(1);
  if (!row || row.formSlug !== null) throw new ActionError("This appointment no longer exists.");
}
