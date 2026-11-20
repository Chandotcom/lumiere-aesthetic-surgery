import "server-only";
import { consultationDefaults, consultationTextsSchema, type ConsultationTexts } from "./consultation-schema";
import { readContent } from "./read";

/** The consultation form's wording: published edits (drafts in preview), else the built-in text. */
export async function getConsultationTexts(): Promise<ConsultationTexts> {
  const docs = await readContent("consultation");
  const parsed = consultationTextsSchema.safeParse(docs.main);
  return parsed.success ? parsed.data : consultationDefaults();
}
