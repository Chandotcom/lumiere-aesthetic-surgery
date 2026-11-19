import { z } from "zod";

// Shared by the client form (instant feedback) and the server action (source of truth).

export const consultTypes = [
  { value: "in_person", label: "In person", hint: "At our clinic" },
  { value: "virtual", label: "Virtual", hint: "Secure video call" },
] as const;

export const timeframes = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-3_months", label: "In 1–3 months" },
  { value: "3-6_months", label: "In 3–6 months" },
  { value: "researching", label: "Just researching" },
] as const;

export const contactMethods = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone call" },
  { value: "text", label: "Text message" },
] as const;

const values = <T extends readonly { value: string }[]>(o: T) =>
  o.map((x) => x.value) as [T[number]["value"], ...T[number]["value"][]];

export const consultationSchema = z
  .object({
    // Step 1 — interests: pick broad areas first; specific procedures are an optional refinement
    areas: z.array(z.string().max(40)).min(1, "Choose at least one area of interest").max(5),
    procedures: z.array(z.string().max(80)).max(16),
    consultType: z.enum(values(consultTypes), { error: "Choose a consultation type" }),
    timeframe: z.enum(values(timeframes), { error: "Choose a timeframe" }),

    // Step 2 — details
    firstName: z.string().trim().min(1, "Enter your first name").max(60),
    lastName: z.string().trim().min(1, "Enter your last name").max(60),
    email: z.email("Enter a valid email address").max(120),
    phone: z
      .string()
      .trim()
      .max(30)
      .refine((v) => v === "" || /^[+()\d\s.-]{7,}$/.test(v), "Enter a valid phone number"),
    contactMethod: z.enum(values(contactMethods), { error: "Choose how we should contact you" }),

    // Step 3 — message & consent
    message: z.string().trim().max(1000, "Please keep your message under 1,000 characters"),
    smsConsent: z.boolean(),
    marketingConsent: z.boolean(),
    privacyAccepted: z.literal(true, { error: "Please accept the privacy policy to continue" }),

    // Attribution (captured client-side, first touch) + honeypot
    utmSource: z.string().max(100).optional(),
    utmMedium: z.string().max(100).optional(),
    utmCampaign: z.string().max(150).optional(),
    referrer: z.string().max(500).optional(),
    landingPage: z.string().max(500).optional(),
    company: z.string().max(0).optional(), // must stay empty — bots fill it
  })
  // A phone number is required if they want a call/text or agreed to SMS reminders.
  .refine((d) => (d.contactMethod === "email" && !d.smsConsent) || d.phone !== "", {
    path: ["phone"],
    message: "Add a phone number so we can reach you",
  });

export type ConsultationInput = z.infer<typeof consultationSchema>;

/** Fields validated before moving past each step. */
export const stepFields = [
  ["areas", "procedures", "consultType", "timeframe"],
  ["firstName", "lastName", "email", "phone", "contactMethod"],
  ["message", "smsConsent", "marketingConsent", "privacyAccepted"],
] as const satisfies readonly (readonly (keyof ConsultationInput)[])[];
