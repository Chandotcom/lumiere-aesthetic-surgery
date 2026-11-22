// Demo data for pitching: ~150 fictional leads over the last 90 days (see demo-data.ts), so the
// admin inbox and dashboard KPIs look like a working clinic.
//
//   pnpm db:seed:demo           replace all demo data with a fresh set, dated relative to now
//   pnpm db:seed:demo --clear   remove demo data only
//
// Demo leads are found and removed by their @example.com email only, so real submissions are
// never touched. Appointments are removed with their lead (ON DELETE CASCADE).
// The nightly demo reset (/api/cron/demo-reset) does the same on the live site.
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { DEMO_EMAIL_DOMAIN, generate } from "./demo-data";
import { appointments, leads, procedures } from "./schema";

config({ path: ".env.local", quiet: true });

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!));
  const clearOnly = process.argv.includes("--clear");

  const removed = await db
    .delete(leads)
    .where(like(leads.email, `%@${DEMO_EMAIL_DOMAIN}`))
    .returning({ id: leads.id });
  console.log(`Removed ${removed.length} demo leads (and their appointments).`);
  if (clearOnly) return;

  const procedureIds = new Map(
    (await db.select({ id: procedures.id, slug: procedures.slug }).from(procedures)).map((p) => [p.slug, p.id]),
  );
  if (procedureIds.size === 0) console.warn("No procedures found. Run `pnpm db:seed` first to link leads to procedures.");

  const data = generate(Date.now(), procedureIds);
  const inserted = await db
    .insert(leads)
    .values(data.map((d) => d.lead))
    .returning({ id: leads.id, email: leads.email });

  // Match by email (unique per demo lead) rather than relying on RETURNING order.
  const idByEmail = new Map(inserted.map((r) => [r.email, r.id]));
  const apptRows = data.flatMap((d) => d.appts.map((a) => ({ ...a, leadId: idByEmail.get(d.lead.email)! })));
  if (apptRows.length) await db.insert(appointments).values(apptRows);

  console.log(`Inserted ${inserted.length} demo leads and ${apptRows.length} appointments.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
