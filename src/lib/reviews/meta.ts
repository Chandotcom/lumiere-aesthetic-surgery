// Review rules shared by the admin forms (client) and the Server Actions (server).
import { z } from "zod";
import { getProcedure } from "@/lib/content/procedures";
import { isAllowedImageUrl } from "@/lib/cms/schemas";

export const reviewStatusLabel = { pending: "Pending review", approved: "Published", hidden: "Hidden" } as const;
export type ReviewStatus = keyof typeof reviewStatusLabel;
export const isReviewStatus = (v: unknown): v is ReviewStatus => typeof v === "string" && v in reviewStatusLabel;

export const reviewSources = {
  clinic: "Feedback form at the clinic",
  email: "Email from the patient",
  google: "Google review (copied with permission)",
  other: "Other",
} as const;
export type ReviewSource = keyof typeof reviewSources;

/**
 * Allowed reasons for hiding a review. Reviews are never hidden for being negative: hiding a
 * review because of its rating misleads patients (and breaks consumer-review laws in many places).
 */
export const hideReasons = {
  personal_info: "Contains health details or other personal information",
  not_patient: "Not from a genuine patient",
  offensive: "Offensive or abusive language",
  duplicate: "Duplicate of another review",
  patient_request: "The patient asked us to remove it",
} as const;
export type HideReason = keyof typeof hideReasons;

/** Public review cap for the carousel. */
export const REVIEWS_SHOWN = 6;

// "Sarah M." / "Amara O." / "Jean-Luc" — first name and optional initial only, for privacy.
const NAME_PATTERN = /^[\p{L}][\p{L}'’-]*( [\p{L}]\.?)?$/u;

export const reviewSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Add the reviewer’s first name.")
      .max(40)
      .regex(NAME_PATTERN, "Use a first name and last initial only, like “Sarah M.”"),
    rating: z.number("Choose a rating.").int().min(1, "Choose a rating.").max(5),
    body: z.string().trim().min(20, "The review should be at least 20 characters.").max(600, "Keep it under 600 characters."),
    procedureSlug: z.string().refine((s) => s === "" || Boolean(getProcedure(s)), "Choose a procedure."),
    source: z.enum(Object.keys(reviewSources) as [ReviewSource]),
    verified: z.boolean(),
    photo: z.object({
      src: z.string().trim().refine((s) => s === "" || isAllowedImageUrl(s), "Choose an image from the media library."),
      alt: z.string().trim().max(200),
    }),
  })
  .refine((v) => !v.photo.src || v.photo.alt.length > 0, {
    path: ["photo", "alt"],
    message: "Describe the photo for screen-reader users.",
  });
export type ReviewFields = z.input<typeof reviewSchema>;

export const emptyReview: ReviewFields = {
  name: "",
  rating: 5,
  body: "",
  procedureSlug: "",
  source: "clinic",
  verified: false,
  photo: { src: "", alt: "" },
};

/** What the public carousel needs. */
export type PublicReview = {
  id: string;
  quote: string;
  name: string;
  /** Procedure name, e.g. "Rhinoplasty", or null */
  procedure: string | null;
  rating: number;
  image: { src: string; alt: string } | null;
  isSample: boolean;
};
