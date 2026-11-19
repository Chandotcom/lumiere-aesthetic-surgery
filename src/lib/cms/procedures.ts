import "server-only";
import { procedures as defaults, type Procedure } from "@/lib/content/procedures";
import { readContent } from "./read";
import { procedureFieldsSchema, type ProcedureFields } from "./schemas";

/** The editable part of a procedure, in form shape. */
export function procedureToFields(p: Procedure): ProcedureFields {
  return {
    tagline: p.tagline,
    summary: p.summary,
    image: { src: p.image.src, alt: p.image.alt },
    facts: { ...p.facts },
    price: { ...p.price },
    idealFor: p.idealFor.map((value) => ({ value })),
    timeline: p.timeline.map((t) => ({ ...t })),
    faqs: p.faqs.map((f) => ({ ...f })),
    seo: { title: p.seoTitle ?? "", description: p.seoDescription ?? "" },
  };
}

function applyFields(p: Procedure, f: ProcedureFields): Procedure {
  return {
    ...p,
    tagline: f.tagline,
    summary: f.summary,
    image: f.image,
    facts: f.facts,
    price: f.price,
    idealFor: f.idealFor.map((i) => i.value),
    timeline: f.timeline,
    faqs: f.faqs,
    seoTitle: f.seo.title || undefined,
    seoDescription: f.seo.description || undefined,
  };
}

/**
 * Procedures with published edits applied (drafts in preview). Slug, name and category
 * always come from the code, so links and filters never break. A stored document that no
 * longer matches the schema is ignored rather than breaking the page.
 */
export async function getProcedures(): Promise<Procedure[]> {
  const docs = await readContent("procedure");
  return defaults.map((p) => {
    const parsed = procedureFieldsSchema.safeParse(docs[p.slug]);
    return parsed.success ? applyFields(p, parsed.data) : p;
  });
}

export async function getProcedureBySlug(slug: string) {
  return (await getProcedures()).find((p) => p.slug === slug);
}
