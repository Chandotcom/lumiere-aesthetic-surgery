import "server-only";
import { formSchema, type FormFields } from "./form-schema";
import { readContent, readDocument } from "./read";
import { getDocument, listDocuments } from "./store";

/**
 * Custom forms, keyed by slug: published versions for visitors, drafts in staff preview.
 * Cached with the CMS (`cms:form`), so publishing refreshes them straight away. Stored data
 * that no longer matches the schema is skipped rather than breaking the page.
 */
export async function getForms(): Promise<Map<string, FormFields>> {
  const docs = await readContent("form");
  const out = new Map<string, FormFields>();
  for (const [slug, data] of Object.entries(docs)) {
    const parsed = formSchema.safeParse(data);
    if (parsed.success) out.set(slug, parsed.data);
  }
  return out;
}

export async function getForm(slug: string): Promise<FormFields | undefined> {
  const parsed = formSchema.safeParse(await readDocument("form", slug));
  return parsed.success ? parsed.data : undefined;
}

/** The live definition, uncached and never a draft. Submissions are validated against this. */
export async function getPublishedForm(slug: string) {
  const doc = await getDocument("form", slug);
  const parsed = formSchema.safeParse(doc?.published);
  return parsed.success ? parsed.data : null;
}

/** Every stored form's title (latest draft, else live), by slug, for admin listings. */
export async function listFormTitles(): Promise<Map<string, string>> {
  const docs = await listDocuments("form");
  return new Map(
    docs.map((d) => {
      const parsed = formSchema.safeParse(d.draft ?? d.published);
      return [d.key, parsed.success ? parsed.data.title : d.key];
    }),
  );
}
