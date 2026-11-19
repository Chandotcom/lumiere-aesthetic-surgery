import { site } from "@/lib/site";

// JSON-LD builders. Render with <JsonLd data={...} />.

/** Pass the editable contact settings so structured data matches what the page shows. */
export function clinicSchema(contact: { phone: string; email: string } = site) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: site.name,
    url: site.url,
    telephone: contact.phone,
    email: contact.email,
    medicalSpecialty: "PlasticSurgery",
    description: site.description,
  };
}

export function procedureSchema(p: {
  name: string;
  summary: string;
  slug: string;
  category: string;
  image: string;
  recovery: string;
  surgical: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: p.name,
    description: p.summary,
    url: new URL(`/procedures/${p.slug}`, site.url).toString(),
    image: p.image,
    procedureType: p.surgical ? "SurgicalProcedure" : "NoninvasiveProcedure",
    bodyLocation: p.category,
    followup: `Typical recovery: ${p.recovery}`,
    howPerformed: `Performed at ${site.name} by ${site.surgeon} and team.`,
    provider: { "@type": "MedicalClinic", name: site.name, url: site.url },
  };
}

export function articleSchema(a: {
  title: string;
  excerpt: string;
  slug: string;
  image: string;
  publishedAt: string;
}) {
  const author = { "@type": "Person", name: site.surgeon, jobTitle: "Board-certified plastic surgeon" };
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.excerpt,
    image: a.image,
    datePublished: a.publishedAt,
    dateModified: a.publishedAt,
    mainEntityOfPage: new URL(`/blog/${a.slug}`, site.url).toString(),
    author,
    reviewedBy: author,
    publisher: { "@type": "MedicalClinic", name: site.name, url: site.url },
  };
}

export function physicianSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: site.surgeon,
    medicalSpecialty: "PlasticSurgery",
    url: new URL("/about", site.url).toString(),
    worksFor: { "@type": "MedicalClinic", name: site.name, url: site.url },
    description: `${site.surgeon} is the founder and lead surgeon of ${site.name} (fictional demo practice).`,
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function breadcrumbSchema(crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: new URL(c.path, site.url).toString(),
    })),
  };
}
