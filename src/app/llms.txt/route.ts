import { getProcedures } from "@/lib/cms/procedures";
import { categories, formatPrice } from "@/lib/content/procedures";
import { site } from "@/lib/site";

// AEO: a plain-text summary for AI answer engines (llms.txt convention).
export async function GET() {
  const procedures = await getProcedures();
  const procedureList = categories
    .map(
      (c) =>
        `### ${c.name}\n` +
        procedures
          .filter((p) => p.category === c.name)
          .map(
            (p) =>
              `- [${p.name}](${site.url}/procedures/${p.slug}): ${p.tagline} Recovery ${p.facts.recovery}; from ${formatPrice(p.price.from)}.`,
          )
          .join("\n"),
    )
    .join("\n\n");

  const body = `# ${site.name}

> ${site.description}

This is a fictional demo practice. Content is illustrative and not medical advice.

## Key pages
- [Request a consultation](${site.url}/consultation)
- [All procedures](${site.url}/procedures)
- [Before & after gallery](${site.url}/gallery)
- [About Dr. Marsh](${site.url}/about)
- [Journal](${site.url}/blog)
- [Contact & location](${site.url}/contact)
- [Privacy policy](${site.url}/privacy)

## Procedures
${procedureList}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
