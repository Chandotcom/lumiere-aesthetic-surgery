"use server";

import { after } from "next/server";
import { getDb, schema } from "@/db";
import { answerText, buildSubmissionSchema, formSlugSchema, type MapsTo } from "@/lib/cms/form-schema";
import { getPublishedForm } from "@/lib/cms/forms";
import { getSiteSettings } from "@/lib/cms/settings";
import { notifyNewLead } from "@/lib/email/notify-lead";
import { attributionColumns } from "@/lib/validation/attribution";

export type FormResult =
  | { ok: true; demo?: boolean }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const unavailable = { ok: false, error: "This form is no longer available. Please call us instead." } as const;

/**
 * A custom form submission becomes a lead. The answers are validated against the *published*
 * definition (never the browser's copy). Submission contents are never logged.
 */
export async function submitForm(slug: string, input: unknown): Promise<FormResult> {
  if (!formSlugSchema.safeParse(slug).success) return unavailable;

  // Demo mode: no database connected, so there's no published form to check against either.
  if (!process.env.DATABASE_URL) {
    console.warn("[forms] DATABASE_URL not set — submission accepted in demo mode and not stored.");
    return { ok: true, demo: true };
  }

  let form;
  try {
    form = await getPublishedForm(slug);
  } catch (err) {
    console.error("[forms] failed to load form:", err instanceof Error ? err.message : err);
    return { ok: false, error: "We couldn’t send your message just now. Please try again or call us directly." };
  }
  if (!form) return unavailable;

  const parsed = buildSubmissionSchema(form).safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }
  const d = parsed.data;

  // Honeypot filled → silently pretend success so bots learn nothing.
  if (d.company) return { ok: true };

  const answers = d.answers as Record<string, unknown>;
  const mapped = (m: MapsTo) => {
    const f = form.fields.find((x) => x.mapsTo === m);
    return f ? answerText(f, answers[f.id]) : "";
  };
  const name = mapped("name");
  const email = mapped("email");
  // Everything not stored in a lead column is kept with the question as it read at the time.
  const formAnswers = form.fields
    .filter((f) => !f.mapsTo)
    .map((f) => ({ label: f.label, value: answerText(f, answers[f.id]) }))
    .filter((a) => a.value !== "");

  let lead: { id: number; createdAt: Date; source: string };
  try {
    [lead] = await getDb()
      .insert(schema.leads)
      .values({
        name,
        email,
        phone: mapped("phone") || null,
        message: mapped("message") || null,
        marketingConsent: form.showMarketingConsent && d.marketingConsent,
        formSlug: slug,
        formAnswers,
        ...attributionColumns(d),
      })
      .returning({ id: schema.leads.id, createdAt: schema.leads.createdAt, source: schema.leads.source });
  } catch (err) {
    console.error("[forms] failed to store lead:", err instanceof Error ? err.message : err);
    return { ok: false, error: "We couldn’t send your message just now. Please try again or call us directly." };
  }

  const [firstName, ...rest] = name.split(/\s+/);
  const settings = await getSiteSettings();
  after(() =>
    notifyNewLead({
      ...lead,
      firstName,
      lastName: rest.join(" "),
      email,
      formTitle: form.title,
      settings: { phone: settings.phone, notificationEmail: settings.notificationEmail ?? "" },
    }),
  );

  return { ok: true };
}

