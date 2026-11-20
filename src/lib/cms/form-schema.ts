// Custom forms ("form builder"). A form is a title, intro and an ordered list of questions.
// Client-safe: shared by the admin editor, the public renderer (instant feedback) and the server
// action, which always validates against the *published* definition, never the browser's copy.
import { z } from "zod";
import { attributionShape } from "@/lib/validation/attribution";

const text = (max: number, label = "This field") =>
  z.string().trim().min(1, `${label} is required.`).max(max, `${label} is limited to ${max} characters.`);
const optional = (max: number, label = "This field") =>
  z.string().trim().max(max, `${label} is limited to ${max} characters.`);

export const FIELD_TYPES = ["shortText", "longText", "email", "phone", "select", "radio", "checkboxes", "date", "yesNo"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const fieldTypes: Record<FieldType, { label: string; description: string }> = {
  shortText: { label: "Short answer", description: "One line of text." },
  longText: { label: "Paragraph", description: "Several lines of text." },
  email: { label: "Email", description: "Checked to be a valid address." },
  phone: { label: "Phone", description: "Checked to look like a phone number." },
  select: { label: "Dropdown", description: "Pick one option from a list." },
  radio: { label: "Multiple choice", description: "Pick one option, all shown." },
  checkboxes: { label: "Checkboxes", description: "Pick any number of options." },
  date: { label: "Date", description: "A calendar date." },
  yesNo: { label: "Yes / No", description: "A simple yes or no." },
};

export const CHOICE_TYPES: readonly FieldType[] = ["select", "radio", "checkboxes"];
export const isChoice = (t: FieldType) => CHOICE_TYPES.includes(t);

/** Some answers fill a lead's own columns, so the Leads inbox can show and contact them. */
export const MAPS_TO = ["name", "email", "phone", "message"] as const;
export type MapsTo = (typeof MAPS_TO)[number];
export const mapsToLabel: Record<MapsTo, string> = {
  name: "Lead’s name",
  email: "Lead’s email",
  phone: "Lead’s phone",
  message: "Lead’s message",
};
const mapsToTypes: Record<MapsTo, readonly FieldType[]> = {
  name: ["shortText"],
  email: ["email"],
  phone: ["phone"],
  message: ["longText", "shortText"],
};

export const fieldSchema = z.object({
  /** Stable key for the answer, generated when the field is added. Never shown. */
  id: z.string().regex(/^f_[a-z0-9]{3,16}$/, "Invalid field id."),
  type: z.enum(FIELD_TYPES),
  label: text(120, "Question"),
  hint: optional(200, "Help text"),
  required: z.boolean(),
  options: z.array(z.object({ label: text(80, "Option") })).max(12, "Up to 12 options."),
  mapsTo: z.union([z.enum(MAPS_TO), z.literal("")]),
});
export type FormField = z.infer<typeof fieldSchema>;

export const formSchema = z
  .object({
    title: text(120, "Title"),
    intro: optional(400, "Intro"),
    submitLabel: text(40, "Button text"),
    successMessage: text(300, "Thank-you message"),
    /** Adds an optional, unticked "send me news and offers" checkbox. */
    showMarketingConsent: z.boolean(),
    fields: z.array(fieldSchema).min(2, "Add at least 2 questions.").max(20, "Up to 20 questions per form."),
  })
  .superRefine((form, ctx) => {
    const ids = new Set<string>();
    form.fields.forEach((f, i) => {
      if (ids.has(f.id)) ctx.addIssue({ code: "custom", path: ["fields", i, "id"], message: "Duplicate field id." });
      ids.add(f.id);
      if (isChoice(f.type)) {
        if (f.options.length < 2) ctx.addIssue({ code: "custom", path: ["fields", i, "options"], message: "Add at least 2 options." });
        const seen = new Set<string>();
        f.options.forEach((o, j) => {
          const k = o.label.trim().toLowerCase();
          if (seen.has(k)) ctx.addIssue({ code: "custom", path: ["fields", i, "options", j, "label"], message: "Each option must be different." });
          seen.add(k);
        });
      }
      if (f.mapsTo && !mapsToTypes[f.mapsTo].includes(f.type)) {
        ctx.addIssue({
          code: "custom",
          path: ["fields", i, "mapsTo"],
          message: `${mapsToLabel[f.mapsTo]} needs a ${mapsToTypes[f.mapsTo].map((t) => fieldTypes[t].label).join(" or ")} question.`,
        });
      }
    });
    for (const m of MAPS_TO) {
      const n = form.fields.filter((f) => f.mapsTo === m).length;
      if (n > 1) ctx.addIssue({ code: "custom", path: ["fields"], message: `Only one question can be used as ${mapsToLabel[m].toLowerCase()}.` });
    }
    for (const m of ["name", "email"] as const) {
      const i = form.fields.findIndex((f) => f.mapsTo === m);
      if (i < 0) ctx.addIssue({ code: "custom", path: ["fields"], message: `The form needs a question used as ${mapsToLabel[m].toLowerCase()}.` });
      else if (!form.fields[i].required) ctx.addIssue({ code: "custom", path: ["fields", i, "required"], message: "This question is used for the lead, so it must be required." });
    }
  });

export type FormFields = z.infer<typeof formSchema>;

// Forms live at /forms/<slug>. "new" and "consultation" are admin routes under /admin/forms.
const RESERVED = new Set(["new", "consultation"]);

export const formSlugSchema = z
  .string()
  .trim()
  .min(3, "Use at least 3 characters.")
  .max(60, "Keep the address under 60 characters.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens, e.g. callback-request.")
  .refine((s) => !RESERVED.has(s), "This address is reserved. Choose another.");

/** A random, stable field id. */
export function newFieldId() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `f_${Array.from(bytes, (b) => (b % 36).toString(36)).join("")}`;
}

/** Starting values for a newly added question. Every default passes the schema. */
export function newField(type: FieldType): FormField {
  const base = { id: newFieldId(), type, hint: "", required: false, options: [] as { label: string }[], mapsTo: "" as const };
  switch (type) {
    case "shortText":
      return { ...base, label: "Your question" };
    case "longText":
      return { ...base, label: "Tell us more" };
    case "email":
      return { ...base, label: "Email" };
    case "phone":
      return { ...base, label: "Phone" };
    case "date":
      return { ...base, label: "Preferred date" };
    case "yesNo":
      return { ...base, label: "Have you visited us before?" };
    case "select":
    case "radio":
    case "checkboxes":
      return { ...base, label: "Choose an option", options: [{ label: "Option 1" }, { label: "Option 2" }] };
  }
}

/** A new form starts with name, email and message, already used for the lead. */
export function newFormFields(title: string): FormFields {
  return {
    title,
    intro: "",
    submitLabel: "Send",
    successMessage: "Thank you. We’ve received your message and will be in touch within one business day.",
    showMarketingConsent: false,
    fields: [
      { id: "f_name", type: "shortText", label: "Full name", hint: "", required: true, options: [], mapsTo: "name" },
      { id: "f_email", type: "email", label: "Email", hint: "", required: true, options: [], mapsTo: "email" },
      {
        id: "f_message",
        type: "longText",
        label: "Message",
        hint: "Please don’t include medical details. We’ll discuss them privately.",
        required: false,
        options: [],
        mapsTo: "message",
      },
    ],
  };
}

// ── Submissions ──────────────────────────────────────────────────────────

const PHONE = /^[+()\d\s.-]{7,}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function answerSchema(f: FormField): z.ZodType {
  const req = f.required;
  const blank = (v: unknown) => v == null || v === "" || (Array.isArray(v) && v.length === 0);
  const options = f.options.map((o) => o.label);
  switch (f.type) {
    case "shortText":
    case "longText": {
      const max = f.type === "shortText" ? 200 : 2000;
      const s = z.string().trim().max(max, `Please keep this under ${max.toLocaleString("en-US")} characters.`);
      return req ? s.min(1, "Please fill this in.") : s;
    }
    case "email":
      return req
        ? z.string().trim().pipe(z.email("Enter a valid email address.").max(120))
        : z.union([z.literal(""), z.string().trim().pipe(z.email("Enter a valid email address.").max(120))]);
    case "phone":
      return z
        .string()
        .trim()
        .max(30)
        .refine((v) => !req || v !== "", "Please fill this in.")
        .refine((v) => v === "" || PHONE.test(v), "Enter a valid phone number.");
    case "date":
      return z
        .string()
        .refine((v) => !req || v !== "", "Please choose a date.")
        .refine((v) => v === "" || (DATE.test(v) && !Number.isNaN(Date.parse(v))), "Enter a valid date.");
    case "select":
    case "radio":
      return z
        .string()
        .nullable()
        .refine((v) => !req || !blank(v), "Please choose an option.")
        .refine((v) => blank(v) || options.includes(v!), "Please choose one of the options.");
    case "yesNo":
      return z
        .string()
        .nullable()
        .refine((v) => !req || !blank(v), "Please choose yes or no.")
        .refine((v) => blank(v) || v === "yes" || v === "no", "Please choose yes or no.");
    case "checkboxes":
      return z
        .array(z.string())
        .max(options.length)
        .refine((v) => !req || v.length > 0, "Please choose at least one option.")
        .refine((v) => v.every((x) => options.includes(x)), "Please choose from the options.");
  }
}

/**
 * Validator for one form's submissions. Answers sit under `answers.<field id>`. A privacy-policy
 * acceptance is always required, and attribution plus the honeypot are always accepted.
 */
export function buildSubmissionSchema(form: FormFields) {
  return z.object({
    answers: z.object(Object.fromEntries(form.fields.map((f) => [f.id, answerSchema(f)]))),
    marketingConsent: z.boolean(),
    privacyAccepted: z.literal(true, { error: "Please accept the privacy policy to continue." }),
    ...attributionShape,
  });
}

/** Empty starting values for the public form. */
export function emptyAnswers(form: FormFields) {
  return Object.fromEntries(
    form.fields.map((f) => [f.id, f.type === "checkboxes" ? [] : f.type === "radio" || f.type === "yesNo" ? null : ""]),
  );
}

/** A validated answer as readable text ("" when left empty). */
export function answerText(f: FormField, value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (f.type === "yesNo") return value === "yes" ? "Yes" : value === "no" ? "No" : "";
  return String(value).trim();
}
