import "server-only";
import { and, count, eq, gte, ne } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { can } from "@/lib/admin/roles";
import { listStaff } from "@/lib/admin/staff";
import { formatClinicDateTime } from "@/lib/admin/time";
import { site } from "@/lib/site";
import { hasEmail, hasVerifiedSender, sendEmail } from "./send";
import { newLeadAlert, requestReceived } from "./templates";

type NewLead = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  source: string;
  createdAt: Date;
  /** Set for custom forms (admin → Forms). The form title is not patient data. */
  formTitle?: string;
  /** From the published contact settings, read in the request before `after()`. */
  settings: { phone: string; notificationEmail: string };
};

const sourceLabel = (s: string) =>
  ({ website: "the website", referral: "another website", google: "Google" })[s] ?? s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Emails for a new consultation request. Runs after the response (`after()`), so it never slows
 * the visitor down, and every failure is swallowed and logged without personal data.
 *
 * 1. Staff alert to the clinic inbox (contact settings) plus every account whose role can see leads.
 * 2. Patient confirmation, only with a verified sender (EMAIL_FROM) and at most once per address
 *    per 24 hours, so the public form can't be used to flood someone's inbox.
 */
export async function notifyNewLead(lead: NewLead) {
  if (!hasEmail()) return;

  // 1. Staff alert
  try {
    const team = await listStaff().catch(() => []);
    const to = [
      lead.settings.notificationEmail,
      ...team.filter((m) => can(m.role, "leads")).map((m) => m.email),
    ]
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const alert = newLeadAlert({
      displayName: lead.lastName ? `${lead.firstName} ${lead.lastName.charAt(0).toUpperCase()}.` : lead.firstName,
      receivedAt: formatClinicDateTime(lead.createdAt),
      source: sourceLabel(lead.source),
      leadUrl: new URL(`/admin/leads/${lead.id}`, site.url).toString(),
      formTitle: lead.formTitle,
    });
    // One message per recipient, so staff addresses aren't shared with each other.
    await Promise.all([...new Set(to)].map((addr) => sendEmail({ to: [addr], ...alert, tag: "lead_alert" })));
  } catch (err) {
    console.warn("[email] staff alert failed:", err instanceof Error ? err.message : "unknown error");
  }

  // 2. Patient confirmation
  if (!hasVerifiedSender()) return; // Resend's test sender can't reach patients
  try {
    const [{ n }] = await getDb()
      .select({ n: count() })
      .from(schema.leads)
      .where(
        and(
          eq(schema.leads.email, lead.email),
          ne(schema.leads.id, lead.id),
          gte(schema.leads.createdAt, new Date(lead.createdAt.getTime() - 86_400_000)),
        ),
      );
    if (n > 0) return; // already confirmed recently
    await sendEmail({
      to: [lead.email],
      ...requestReceived({ firstName: lead.firstName, phone: lead.settings.phone, siteUrl: site.url, isForm: lead.formTitle != null }),
      tag: "request_received",
    });
  } catch (err) {
    console.warn("[email] confirmation failed:", err instanceof Error ? err.message : "unknown error");
  }
}
