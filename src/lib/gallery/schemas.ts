// Form schemas for the gallery admin, shared by the client forms and the Server Actions.
import { z } from "zod";
import { getProcedure } from "@/lib/content/procedures";
import { consentScopes, GALLERY_AGE_RANGES, GALLERY_VIEWS } from "./meta";

export const caseFieldsSchema = z.object({
  procedureSlug: z.string().refine((s) => Boolean(getProcedure(s)), "Choose a procedure."),
  ageRange: z.enum(GALLERY_AGE_RANGES, "Choose an age range."),
  timeAfter: z.string().trim().min(1, "Say when the after photo was taken.").max(40),
  notes: z.string().trim().max(300, "Keep the notes under 300 characters."),
  views: z.array(z.enum(GALLERY_VIEWS)).min(1, "Choose at least one angle.").max(3),
});
export type CaseFields = z.input<typeof caseFieldsSchema>;

export const consentSchema = z.object({
  consentSigned: z.boolean(),
  consentScope: z.enum(Object.keys(consentScopes) as [keyof typeof consentScopes]),
  showFace: z.boolean(),
});
export type ConsentFields = z.input<typeof consentSchema>;
