import { timingSafeEqual } from "node:crypto";
import { and, inArray, isNotNull, isNull, like, or } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { DEMO_EMAIL_DOMAIN, generate } from "@/db/demo-data";
import { listStaff } from "@/lib/admin/staff";
import { isDemo } from "@/lib/admin/roles";

const { leads, appointments, procedures, contentDocuments } = schema;

/**
 * Nightly demo reset, called by Vercel Cron (vercel.json) with `Authorization: Bearer $CRON_SECRET`.
 * Without CRON_SECRET set, it refuses every request.
 *
 * 1. Deletes every lead from the public consultation form (the samples plus testers' enquiries;
 *    the site is a demo, so nothing real arrives there) with their appointments.
 *    Leads from custom forms (e.g. the outreach questionnaire) are never touched.
 * 2. Re-creates the sample leads, dated relative to now, so the dashboard always looks current.
 * 3. Discards content drafts last saved by demo accounts (their "published" previews).
 */
export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  if (!process.env.DATABASE_URL) return Response.json({ skipped: "no database" });

  const db = getDb();
  const removed = await db
    .delete(leads)
    .where(or(isNull(leads.formSlug), like(leads.email, `%@${DEMO_EMAIL_DOMAIN}`)))
    .returning({ id: leads.id });

  const procedureIds = new Map(
    (await db.select({ id: procedures.id, slug: procedures.slug }).from(procedures)).map((p) => [p.slug, p.id]),
  );
  const data = generate(Date.now(), procedureIds);
  const inserted = await db
    .insert(leads)
    .values(data.map((d) => d.lead))
    .returning({ id: leads.id, email: leads.email });
  const idByEmail = new Map(inserted.map((r) => [r.email, r.id]));
  const apptRows = data.flatMap((d) => d.appts.map((a) => ({ ...a, leadId: idByEmail.get(d.lead.email)! })));
  if (apptRows.length) await db.insert(appointments).values(apptRows);

  const demoIds = (await listStaff()).filter((m) => isDemo(m.role)).map((m) => m.id);
  const drafts = demoIds.length
    ? await db
        .update(contentDocuments)
        .set({ draft: null, draftUpdatedAt: null, draftUpdatedBy: null })
        .where(and(isNotNull(contentDocuments.draft), inArray(contentDocuments.draftUpdatedBy, demoIds)))
        .returning({ id: contentDocuments.id })
    : [];

  // Counts only: no lead data in logs.
  const summary = {
    leadsRemoved: removed.length,
    sampleLeads: inserted.length,
    appointments: apptRows.length,
    draftsDiscarded: drafts.length,
  };
  console.log("[demo-reset]", summary);
  return Response.json(summary);
}

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
