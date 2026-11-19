// Demo gallery cases. Shaped like the `gallery_items` table so the admin gallery manager can
// replace this file later. Images are PLACEHOLDERS — never present edited stock photos as results.

import { getProcedure, procedures, type Category } from "./procedures";

export type View = "Front" | "Profile" | "Oblique";

export type GalleryCase = {
  /** URL slug, e.g. "rhinoplasty-1042" */
  slug: string;
  number: number;
  procedureSlug: string;
  category: Category;
  /** Patient age range — never exact age or identifying detail */
  ageRange: string;
  /** Time between treatment and the "after" photo */
  timeAfter: string;
  /** Photo angles available for this case (each is a before/after pair) */
  views: View[];
  notes: string;
  /** ISO date the case was published — used for "newest first" ordering */
  publishedAt: string;
  /** Mirrors gallery_items consent fields — only consented cases are ever listed */
  consentSigned: true;
  showFace: boolean;
  /**
   * Image URLs per angle, served through the consent-checking /api/gallery-image route.
   * Missing (sample cases, or this placeholder file) → PlaceholderPhoto art.
   */
  photos?: Partial<Record<View, CasePhotoPair>>;
};

export type CasePhotoPair = { before: string; after: string };

// Per-procedure case notes; one demo case is generated per note.
const notes: Record<string, string[]> = {
  rhinoplasty: ["Dorsal hump reduction and tip refinement.", "Narrowed bridge; septoplasty for breathing.", "Revision rhinoplasty to correct asymmetry.", "Subtle tip lift and nostril refinement."],
  facelift: ["Deep-plane facelift with neck lift.", "Mini facelift for early jowling.", "Facelift combined with fat transfer."],
  "eyelid-surgery": ["Upper blepharoplasty for hooded lids.", "Lower blepharoplasty for under-eye bags.", "Upper and lower eyelid surgery."],
  "brow-lift": ["Endoscopic brow lift.", "Temporal brow lift for outer-brow heaviness."],
  "breast-augmentation": ["Round silicone implants, dual-plane placement.", "Restoring volume after breastfeeding.", "Correction of breast asymmetry.", "Natural-profile implants, inframammary incision."],
  "breast-lift": ["Vertical lift with areola reduction.", "Lift with small implants.", "Periareolar lift for mild sagging."],
  "breast-reduction": ["Reduction for back and shoulder relief.", "Reduction with lift for improved shape."],
  "breast-revision": ["Implant exchange for capsular contracture.", "Implant removal with lift."],
  "tummy-tuck": ["Full abdominoplasty with muscle repair.", "Mini tummy tuck for lower-abdomen laxity.", "Extended tummy tuck after weight loss."],
  liposuction: ["Liposuction of flanks and abdomen.", "Inner and outer thigh liposuction.", "Chin and neck liposuction."],
  "mommy-makeover": ["Tummy tuck combined with breast lift.", "Augmentation, tummy tuck and flank liposuction."],
  "arm-lift": ["Brachioplasty after weight loss.", "Limited-incision arm lift."],
  injectables: ["Forehead and frown-line treatment.", "Crow’s feet softening."],
  fillers: ["Cheek and under-eye hyaluronic acid filler.", "Lip balancing with soft filler.", "Jawline definition with filler."],
  laser: ["Two sessions of fractional laser resurfacing.", "Treatment for sun spots and pigmentation."],
  facials: ["Series of four medical facials for congestion."],
};

const ages = ["18–24", "25–34", "35–44", "45–54", "55–64"];
const ageBias: Partial<Record<string, number>> = { facelift: 3, "eyelid-surgery": 2, "brow-lift": 2, laser: 2 };
const timeAfter: Record<Category, string[]> = {
  Face: ["3 months", "6 months", "9 months", "12 months"],
  Breast: ["4 months", "6 months", "8 months", "12 months"],
  Body: ["4 months", "6 months", "9 months", "12 months"],
  "Non-surgical": ["2 weeks", "1 month", "3 months"],
};
const viewsFor: Record<Category, View[][]> = {
  Face: [["Front", "Profile", "Oblique"], ["Profile", "Front"], ["Front", "Oblique"]],
  Breast: [["Front", "Oblique"], ["Front", "Oblique", "Profile"]],
  Body: [["Front", "Oblique"], ["Front", "Profile"]],
  "Non-surgical": [["Front"], ["Front", "Oblique"]],
};

// Deterministic generation so slugs and order are stable across builds.
let n = 1000;
const perProcedure = procedures.map((p) =>
  (notes[p.slug] ?? []).map((note, i) => {
    n += 7;
    return {
      slug: `${p.slug}-${n}`,
      number: n,
      procedureSlug: p.slug,
      category: p.category,
      ageRange: ages[Math.min(ages.length - 1, (i + (ageBias[p.slug] ?? 1)) % ages.length)],
      timeAfter: timeAfter[p.category][i % timeAfter[p.category].length],
      views: viewsFor[p.category][i % viewsFor[p.category].length],
      notes: note,
      publishedAt: "",
      consentSigned: true as const,
      showFace: p.category === "Face" || p.category === "Non-surgical",
    };
  }),
);

// Round-robin across procedures so "newest first" looks like a real, mixed publishing history.
const interleaved: GalleryCase[] = [];
for (let round = 0; interleaved.length < perProcedure.flat().length; round++) {
  for (const list of perProcedure) if (list[round]) interleaved.push(list[round]);
}
export const galleryCases: GalleryCase[] = interleaved.map((c, i) => ({
  ...c,
  publishedAt: new Date(Date.UTC(2026, 10, 15) - i * 4 * 86_400_000).toISOString().slice(0, 10),
})); // already newest first

export const PAGE_SIZE = 12;

export const getCase = (slug: string) => galleryCases.find((c) => c.slug === slug);

export const casesFor = (procedureSlug: string) => galleryCases.filter((c) => c.procedureSlug === procedureSlug);

export const caseTitle = (c: GalleryCase) => `${getProcedure(c.procedureSlug)?.name ?? "Case"} · Case ${c.number}`;
