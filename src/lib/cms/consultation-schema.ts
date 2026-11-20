// Editable wording of the consultation form (admin → Forms → Consultation form). Only labels, hints
// and option labels are editable: the questions, their order and the stored values stay in code,
// so stored leads, KPIs and the admin's own labels (format.ts) keep working. Client-safe.
import { z } from "zod";
import { consultTypes, contactMethods, timeframes } from "@/lib/validation/consultation";

const text = (max: number, label = "This field") =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is limited to ${max} characters.`);
const optional = (max: number, label = "This field") =>
  z.string().trim().max(max, `${label} is limited to ${max} characters.`);

/** The privacy consent must contain exactly one [link text] in brackets, which links to /privacy. */
const withLink = text(300, "Privacy consent").refine(
  (v) => /^[^[\]]*\[[^[\]]+\][^[\]]*$/.test(v),
  "Put the link words in square brackets once, e.g. I have read the [privacy policy] and agree…",
);

/** `{name}` in the success heading is replaced with the visitor's first name. */
export const NAME_TOKEN = "{name}";

const option = z.object({ label: text(60, "Option") });
const optionWithHint = z.object({ label: text(60, "Option"), hint: optional(80, "Option hint") });

export const consultationTextsSchema = z.object({
  steps: z.object({ interests: text(40, "Step title"), details: text(40, "Step title"), confirm: text(40, "Step title") }),
  interests: z.object({
    areasQuestion: text(120, "Question"),
    areasHint: optional(200, "Help text"),
    notSureLabel: text(80, "Not sure option"),
    specificQuestion: text(120, "Question"),
    consultTypeQuestion: text(120, "Question"),
    timeframeQuestion: text(120, "Question"),
  }),
  details: z.object({
    firstName: text(40, "Label"),
    lastName: text(40, "Label"),
    email: text(40, "Label"),
    phone: text(40, "Label"),
    contactMethodQuestion: text(120, "Question"),
  }),
  consultTypes: z.object({ in_person: optionWithHint, virtual: optionWithHint }),
  timeframes: z.object({ asap: option, "1-3_months": option, "3-6_months": option, researching: option }),
  contactMethods: z.object({ email: option, phone: option, text: option }),
  confirm: z.object({
    messageLabel: text(120, "Label"),
    messageHint: optional(300, "Help text"),
    smsConsent: text(300, "SMS consent"),
    marketingConsent: text(300, "Marketing consent"),
    privacyConsent: withLink,
    securityNote: optional(300, "Security note"),
    submitLabel: text(40, "Button text"),
  }),
  success: z.object({
    heading: text(80, "Heading"),
    text: text(400, "Text"),
  }),
});

export type ConsultationTexts = z.infer<typeof consultationTextsSchema>;

const labels = <T extends readonly { value: string; label: string }[]>(o: T) =>
  Object.fromEntries(o.map((x) => [x.value, { label: x.label }])) as Record<T[number]["value"], { label: string }>;

/** The built-in wording. Option labels come from the same lists that define the stored values. */
export function consultationDefaults(): ConsultationTexts {
  return {
    steps: { interests: "Your interests", details: "Your details", confirm: "Confirm" },
    interests: {
      areasQuestion: "Which area are you interested in?",
      areasHint: "Choose one or more. Your surgeon will help with the details.",
      notSureLabel: "I’m not sure yet — I’d like advice",
      specificQuestion: "Anything specific in mind?",
      consultTypeQuestion: "How would you like to meet?",
      timeframeQuestion: "When are you hoping to have treatment?",
    },
    details: {
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      phone: "Phone",
      contactMethodQuestion: "Preferred way to reach you",
    },
    consultTypes: Object.fromEntries(consultTypes.map((o) => [o.value, { label: o.label, hint: o.hint }])) as ConsultationTexts["consultTypes"],
    timeframes: labels(timeframes),
    contactMethods: labels(contactMethods),
    confirm: {
      messageLabel: "Anything you’d like us to know?",
      messageHint: "Please don’t include medical history here — we’ll discuss it privately at your consultation.",
      smsConsent: "Text me appointment reminders and updates. Message & data rates may apply. Reply STOP to opt out at any time.",
      marketingConsent: "Send me occasional news and offers by email. Unsubscribe at any time.",
      privacyConsent: "I have read the [privacy policy] and agree to be contacted about my consultation request.",
      securityNote:
        "Your information is sent securely and used only to arrange your consultation. Consenting to texts or marketing is never required.",
      submitLabel: "Request a consultation",
    },
    success: {
      heading: `Thank you, ${NAME_TOKEN}.`,
      text: "Your consultation request has been received. A patient coordinator will contact you within one business day to find a time that suits you.",
    },
  };
}

/** Split the privacy consent into the text before, inside and after its [link]. */
export function splitLink(v: string): [string, string, string] {
  const m = /^([^[]*)\[([^\]]+)\](.*)$/.exec(v);
  return m ? [m[1], m[2], m[3]] : [v, "", ""];
}
