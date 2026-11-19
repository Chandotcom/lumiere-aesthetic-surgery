// Demo data for pitching: ~150 fictional leads over the last 90 days, each with a realistic
// lifecycle (first response → consultation → surgery or not, plus no-shows and follow-ups),
// so the admin inbox and dashboard KPIs look like a working clinic.
//
//   pnpm db:seed:demo           replace all demo data with a fresh set, dated relative to now
//   pnpm db:seed:demo --clear   remove demo data only
//
// Every demo lead uses an @example.com email (a reserved domain) and a fictional 555-01xx
// phone number. Those are the markers used to find and remove them, so real submissions are
// never touched. Appointments are removed with their lead (ON DELETE CASCADE).
// The same random seed is used each run, so the data is reproducible.
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { clinicDayKey, clinicTimeToDate } from "../lib/admin/time";
import { procedures as content } from "../lib/content/procedures";
import { consultTypes, contactMethods, timeframes } from "../lib/validation/consultation";
import { appointments, leads, procedures } from "./schema";

config({ path: ".env.local", quiet: true });

export const DEMO_EMAIL_DOMAIN = "example.com";

const LEAD_COUNT = 150;
const DAYS = 90;
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// ── Deterministic randomness ─────────────────────────────────────────────
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261119);
const chance = (p: number) => rand() < p;
const between = (min: number, max: number) => min + rand() * (max - min);
const pick = <T>(items: readonly T[]) => items[Math.floor(rand() * items.length)]!;
function weighted<T>(items: readonly (readonly [T, number])[]) {
  const total = items.reduce((sum, [, w]) => sum + w, 0);
  let r = rand() * total;
  for (const [item, w] of items) if ((r -= w) <= 0) return item;
  return items[items.length - 1]![0];
}

// ── Fictional people ─────────────────────────────────────────────────────
const firstNames = [
  "Amelia", "Sofia", "Chloe", "Isabel", "Maya", "Grace", "Leah", "Nora", "Elena", "Hannah",
  "Zoe", "Aria", "Clara", "Lucia", "Ruby", "Ivy", "Naomi", "Julia", "Priya", "Mei",
  "Fatima", "Yara", "Ana", "Sara", "Olivia", "Emma", "Daniel", "James", "Marco", "Lucas",
];
const lastNames = [
  "Bennett", "Moreau", "Castillo", "Nakamura", "Okafor", "Lindqvist", "Rossi", "Patel", "Kowalski", "Haddad",
  "Fischer", "Duarte", "Brennan", "Chen", "Silva", "Novak", "Laurent", "Ibrahim", "Sato", "Walsh",
];

const messages = [
  "I'd like to understand the recovery time and when I could return to work.",
  "Could you tell me more about financing options?",
  "I'm considering this for next year and would like to ask some questions first.",
  "Is a virtual consultation possible? I live a few hours away.",
  "I'd like to know more about what results to expect.",
  "What does the consultation include, and is there a fee?",
  "",
  "",
];

const staffNotes = [
  "Left a voicemail, will try again tomorrow.",
  "Sent the procedure guide by email.",
  "Asked about financing. Shared the payment plan options.",
  "Prefers a Friday appointment.",
  "Wants to think it over, follow up in two weeks.",
  null,
  null,
  null,
];

// ── Traffic sources (first touch) ────────────────────────────────────────
type Touch = { source: string; utmSource?: string; utmMedium?: string; utmCampaign?: string; referrer?: string };
const sources: (readonly [() => Touch, number])[] = [
  [() => ({ source: "google", referrer: "https://www.google.com/" }), 34],
  [() => ({ source: "instagram", utmSource: "instagram", utmMedium: "social", utmCampaign: pick(["spring_glow", "before_after_series"]) }), 20],
  [() => ({ source: "website" }), 15],
  [() => ({ source: "referral", referrer: pick(["https://www.realself.com/", "https://www.healthgrades.com/"]) }), 12],
  [() => ({ source: "facebook", utmSource: "facebook", utmMedium: "paid_social", utmCampaign: "consult_offer" }), 9],
  [() => ({ source: "tiktok", referrer: "https://www.tiktok.com/" }), 5],
  [() => ({ source: "newsletter", utmSource: "newsletter", utmMedium: "email", utmCampaign: "monthly_journal" }), 5],
];

// ── Time helpers ─────────────────────────────────────────────────────────
/** Snap to a weekday business-hours slot in clinic time (9:00–16:30, on the hour or half hour). */
function businessSlot(t: number) {
  const day = new Date(`${clinicDayKey(new Date(t))}T00:00:00Z`);
  while (day.getUTCDay() === 0 || day.getUTCDay() === 6) day.setUTCDate(day.getUTCDate() + 1);
  const hh = String(9 + Math.floor(rand() * 8)).padStart(2, "0");
  const mm = rand() < 0.5 ? "00" : "30";
  return clinicTimeToDate(day.toISOString().slice(0, 10), `${hh}:${mm}`)!.getTime();
}

/** Response delay: mostly within a few hours (log-uniform 5 min → 12 h), with a slow tail. */
function responseDelay() {
  if (chance(0.08)) return between(1, 2.5) * DAY;
  return Math.exp(between(Math.log(5 * MIN), Math.log(12 * HOUR)));
}

const appointmentLength = { consultation: 60, virtual: 30, surgery: 180, follow_up: 30 } as const;

type LeadRow = typeof leads.$inferInsert;
type AppointmentRow = Omit<typeof appointments.$inferInsert, "leadId">;

function generate(now: number, procedureIds: Map<string, number>) {
  const result: { lead: LeadRow; appts: AppointmentRow[] }[] = [];

  for (let i = 0; i < LEAD_COUNT; i++) {
    // Skew toward recent dates so the weekly chart shows gentle growth.
    const createdAt = now - Math.pow(rand(), 1.35) * DAYS * DAY;
    const procedure = pick(content);
    const area = procedure.category;
    const first = pick(firstNames);
    const last = pick(lastNames);
    const touch = weighted(sources)();
    const consultType = pick(consultTypes).value;
    const contactMethod = pick(contactMethods).value;

    const appts: AppointmentRow[] = [];
    let status: LeadRow["status"] = "new";
    let firstRespondedAt: Date | null = null;
    let lastEvent = createdAt;

    // Older leads have all been answered; only the last couple of days can still be waiting.
    const respondedAt = createdAt + responseDelay();
    if (respondedAt < now) {
      firstRespondedAt = new Date(respondedAt);
      lastEvent = respondedAt;
      status = "contacted";

      const addAppt = (type: keyof typeof appointmentLength, start: number, s: AppointmentRow["status"], extra: Partial<AppointmentRow> = {}) => {
        appts.push({
          type,
          startsAt: new Date(start),
          endsAt: new Date(start + appointmentLength[type] * MIN),
          status: s,
          ...extra,
        });
        lastEvent = Math.max(lastEvent, Math.min(start, now));
      };

      if (chance(0.58)) {
        const consultAt = businessSlot(respondedAt + between(2, 21) * DAY);
        const type = consultType === "virtual" ? "virtual" : "consultation";
        status = "consult_booked";

        if (consultAt > now) {
          addAppt(type, consultAt, "scheduled");
        } else {
          const outcome = weighted([["completed", 80], ["no_show", 14], ["cancelled", 6]] as const);
          addAppt(type, consultAt, outcome);
          if (outcome === "no_show") status = chance(0.5) ? "lost" : "contacted";
          else if (outcome === "cancelled") status = "contacted";
          else {
            const next = weighted([["surgery", 42], ["lost", 23], ["deciding", 35]] as const);
            if (next === "lost") status = "lost";
            if (next === "surgery") {
              status = "won";
              const surgeryAt = businessSlot(consultAt + between(7, 45) * DAY);
              const deposit = { depositPaid: true, depositAmount: Math.round(between(5, 10)) * 100 };
              if (surgeryAt > now) addAppt("surgery", surgeryAt, "scheduled", deposit);
              else {
                addAppt("surgery", surgeryAt, "completed", deposit);
                const followAt = businessSlot(surgeryAt + 7 * DAY);
                addAppt("follow_up", followAt, followAt > now ? "scheduled" : chance(0.9) ? "completed" : "no_show");
              }
            }
          }
        }
      } else if (now - createdAt > 14 * DAY && chance(0.55)) {
        status = "lost";
      }
    }

    result.push({
      lead: {
        name: `${first} ${last}`,
        email: `${first}.${last}.${i + 1}@${DEMO_EMAIL_DOMAIN}`.toLowerCase(),
        phone: chance(0.85) ? `+1 555-01${String(Math.floor(rand() * 100)).padStart(2, "0")}` : null,
        procedureId: procedureIds.get(procedure.slug) ?? null,
        procedureInterest: chance(0.8) ? `${area} (${procedure.name})` : area,
        consultType,
        timeframe: pick(timeframes).value,
        contactMethod,
        status,
        message: pick(messages) || null,
        smsConsent: contactMethod !== "email" && chance(0.6),
        marketingConsent: chance(0.35),
        source: touch.source,
        utmSource: touch.utmSource ?? null,
        utmMedium: touch.utmMedium ?? null,
        utmCampaign: touch.utmCampaign ?? null,
        referrer: touch.referrer ?? null,
        landingPage: chance(0.6) ? `/procedures/${procedure.slug}` : pick(["/", "/gallery", "/consultation"]),
        firstRespondedAt,
        notes: firstRespondedAt ? pick(staffNotes) : null,
        createdAt: new Date(createdAt),
        updatedAt: new Date(lastEvent),
      },
      appts,
    });
  }
  return result;
}

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
