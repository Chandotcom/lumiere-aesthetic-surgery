"use server";

import { z } from "zod";
import { after } from "next/server";
import { getDb, schema } from "@/db";
import { getSiteSettings } from "@/lib/cms/settings";
import { notifyNewLead } from "@/lib/email/notify-lead";
import { serviceGroups } from "@/lib/content/home";
import { attributionColumns } from "@/lib/validation/attribution";
import { consultationSchema } from "@/lib/validation/consultation";

/** procedure name → its area (e.g. "Rhinoplasty" → "Face") */
const procedureArea = new Map(
  serviceGroups.flatMap((g) => g.procedures.map((p) => [p.name, g.category] as const)),
);

export type ConsultationResult =
  | { ok: true; firstName: string; demo?: boolean }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function submitConsultation(input: unknown): Promise<ConsultationResult> {
  const parsed = consultationSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(z.flattenError(parsed.error).fieldErrors).map(([k, v]) => [k, v?.[0] ?? "Invalid"]),
    );
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }

  const d = parsed.data;

  // Honeypot filled → silently pretend success so bots learn nothing.
  if (d.company) return { ok: true, firstName: d.firstName };

  // Demo mode: no database connected yet. Never log the submission itself (it may contain health info).
  if (!process.env.DATABASE_URL) {
    console.warn("[consultation] DATABASE_URL not set — submission accepted in demo mode and not stored.");
    return { ok: true, firstName: d.firstName, demo: true };
  }

  let lead: { id: number; createdAt: Date; source: string };
  try {
    [lead] = await getDb()
      .insert(schema.leads)
      .values({
        name: `${d.firstName} ${d.lastName}`,
        email: d.email,
        phone: d.phone || null,
        // e.g. "Face (Rhinoplasty, Facelift); Body" — areas, refined by any specific procedures
        procedureInterest: d.areas
          .map((area) => {
            const specific = d.procedures.filter((p) => procedureArea.get(p) === area);
            return specific.length ? `${area} (${specific.join(", ")})` : area;
          })
          .join("; "),
        consultType: d.consultType,
        timeframe: d.timeframe,
        contactMethod: d.contactMethod,
        message: d.message || null,
        smsConsent: d.smsConsent,
        marketingConsent: d.marketingConsent,
        ...attributionColumns(d),
      })
      .returning({ id: schema.leads.id, createdAt: schema.leads.createdAt, source: schema.leads.source });
  } catch (err) {
    console.error("[consultation] failed to store lead:", err instanceof Error ? err.message : err);
    return {
      ok: false,
      error: "We couldn’t send your request just now. Please try again or call us directly.",
    };
  }

  // Email alerts go out after the response, so they never slow the form down or block the lead.
  const settings = await getSiteSettings();
  after(() =>
    notifyNewLead({
      ...lead,
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      settings: { phone: settings.phone, notificationEmail: settings.notificationEmail ?? "" },
    }),
  );

  return { ok: true, firstName: d.firstName };
}
