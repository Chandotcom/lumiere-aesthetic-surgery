import "server-only";
import { and, count, desc, eq, ilike, isNotNull, or, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { leadScope } from "./lead-scope";

import { leadStatuses, type LeadStatus } from "./lead-status";

export * from "./lead-status";

const { leads, appointments } = schema;

export type Lead = typeof leads.$inferSelect;

// Compile-time check: the shared status list matches the database enum exactly.
type DbLeadStatus = (typeof schema.leadStatus.enumValues)[number];
const _statusesMatch: [LeadStatus, DbLeadStatus] extends [DbLeadStatus, LeadStatus] ? true : never = true;
void _statusesMatch;

/** Escape LIKE wildcards so a search for "50%" means the literal text. */
function likePattern(q: string) {
  return `%${q.replace(/[\\%_]/g, "\\$&")}%`;
}

export const LEADS_LIMIT = 100;

export async function listLeads({ status, q, form }: { status?: LeadStatus; q?: string; form?: string }) {
  const filters: SQL[] = [];
  const scope = await leadScope();
  if (scope) filters.push(scope);
  if (status) filters.push(eq(leads.status, status));
  if (form) filters.push(eq(leads.formSlug, form));
  if (q) {
    const pattern = likePattern(q);
    filters.push(or(ilike(leads.name, pattern), ilike(leads.email, pattern), ilike(leads.phone, pattern))!);
  }
  return getDb()
    .select()
    .from(leads)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(leads.createdAt))
    .limit(LEADS_LIMIT);
}

/** Number of leads per status, for the inbox tabs (optionally for one form only). */
export async function countLeadsByStatus(form?: string) {
  const rows = await getDb()
    .select({ status: leads.status, count: count() })
    .from(leads)
    .where(and(form ? eq(leads.formSlug, form) : undefined, await leadScope()))
    .groupBy(leads.status);
  const counts = Object.fromEntries(leadStatuses.map((s) => [s, 0])) as Record<LeadStatus, number>;
  for (const row of rows) counts[row.status] = row.count;
  return counts;
}

/** Number of leads each custom form has created, by form slug. */
export async function countLeadsByForm() {
  const rows = await getDb()
    .select({ form: leads.formSlug, count: count() })
    .from(leads)
    .where(and(isNotNull(leads.formSlug), await leadScope()))
    .groupBy(leads.formSlug);
  return new Map(rows.map((r) => [r.form!, r.count]));
}

export async function getLead(id: number) {
  const [lead] = await getDb().select().from(leads).where(and(eq(leads.id, id), await leadScope())).limit(1);
  return lead ?? null;
}

export async function listLeadAppointments(leadId: number) {
  return getDb()
    .select()
    .from(appointments)
    .where(eq(appointments.leadId, leadId))
    .orderBy(desc(appointments.startsAt));
}
