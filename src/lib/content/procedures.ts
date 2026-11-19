// Procedure content for /procedures and /procedures/[slug].
// Figures are typical ranges for a fictional demo practice — general information, not medical advice.
// Photos: Unsplash (https://unsplash.com/license). Never real patient results.

import type { Img } from "./home";

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

export type Category = "Face" | "Breast" | "Body" | "Non-surgical";

export type Procedure = {
  slug: string;
  name: string;
  category: Category;
  /** One-line promise used on cards */
  tagline: string;
  /** Direct 2–3 sentence answer to “What is X?” — shown first on the page (AEO) */
  summary: string;
  image: Img;
  facts: { duration: string; anesthesia: string; recovery: string; results: string };
  price: { from: number; to: number };
  idealFor: string[];
  timeline: { when: string; what: string }[];
  faqs: { question: string; answer: string }[];
  /** Optional search-engine overrides (set in the admin). Empty = automatic title / the summary. */
  seoTitle?: string;
  seoDescription?: string;
};

/** The automatic page title used when no custom SEO title is set. */
export const defaultProcedureTitle = (name: string) => `${name} — Cost, Recovery & Results`;

export const categories: { name: Category; id: string; intro: string }[] = [
  { name: "Face", id: "face", intro: "Subtle refinements that keep your features unmistakably yours." },
  { name: "Breast", id: "breast", intro: "Proportion and shape tailored to your frame and goals." },
  { name: "Body", id: "body", intro: "Contouring that restores definition after life’s changes." },
  { name: "Non-surgical", id: "non-surgical", intro: "Refresh without downtime, guided by a medical team." },
];

const img = {
  faceA: { src: unsplash("1531123897727-8f129e1688ce"), alt: "Close portrait of a woman with glowing skin" },
  faceB: { src: unsplash("1524504388940-b1c1722653e1"), alt: "Portrait of a woman with long hair against a dark background" },
  faceC: { src: unsplash("1487412947147-5cebf100ffc2"), alt: "Close-up of a woman’s face with defined brows and lashes" },
  faceD: { src: unsplash("1508214751196-bcfd4ca60f91"), alt: "Smiling woman outdoors in warm evening light" },
  breastA: { src: unsplash("1522337360788-8b13dee7a37e"), alt: "Woman in a white sweater seen from behind, hands in her hair" },
  breastB: { src: unsplash("1494790108377-be9c29b29330"), alt: "Laughing woman with long dark hair in a red sweater" },
  bodyA: { src: unsplash("1571019613454-1cb2f99b2d8b"), alt: "Woman doing a core exercise on a mat in a bright studio" },
  bodyB: { src: unsplash("1518611012118-696072aa579a"), alt: "Women exercising on yoga mats in a bright studio" },
  skinA: { src: unsplash("1552693673-1bf958298935"), alt: "Clinician performing a skin treatment on a relaxed patient" },
  skinB: { src: unsplash("1570172619644-dfd03ed5d881"), alt: "Aesthetician applying a treatment mask during a facial" },
  skinC: { src: unsplash("1616394584738-fc6e612e71b9"), alt: "Woman relaxing during a calming skin treatment" },
  skinD: { src: unsplash("1515377905703-c4788e51af15"), alt: "Hands holding a dropper of facial serum over an open palm" },
} satisfies Record<string, Img>;

export const procedures: Procedure[] = [
  // ── Face ──────────────────────────────────────────────────────────────
  {
    slug: "rhinoplasty",
    name: "Rhinoplasty",
    category: "Face",
    tagline: "A nose in harmony with your face — and, when needed, easier breathing.",
    summary:
      "Rhinoplasty reshapes the nose to bring it into balance with your other features, and can also correct breathing problems. Most patients return to desk work within one to two weeks, while subtle swelling continues to settle for up to a year.",
    image: img.faceA,
    facts: { duration: "2–3 hours", anesthesia: "General", recovery: "1–2 weeks", results: "Permanent" },
    price: { from: 7000, to: 15000 },
    idealFor: [
      "You’d like to refine the size, profile or tip of your nose",
      "You have a bump, asymmetry or a previous injury",
      "You experience breathing difficulty from a deviated septum",
      "Your facial growth is complete (usually 16+)",
    ],
    timeline: [
      { when: "Week 1", what: "Splint and mild bruising; rest with your head elevated." },
      { when: "Weeks 2–3", what: "Splint removed, bruising fades; most return to work." },
      { when: "Weeks 4–6", what: "Light exercise resumes; you look natural in photos." },
      { when: "12 months", what: "Final refinement as the last swelling settles." },
    ],
    faqs: [
      { question: "Will my rhinoplasty look natural?", answer: "Yes — the goal is a nose that suits your face rather than a ‘done’ look. Dr. Marsh uses imaging at your consultation to agree on realistic changes." },
      { question: "Is rhinoplasty painful?", answer: "Most patients describe pressure and congestion more than pain, managed with prescribed medication for the first few days." },
    ],
  },
  {
    slug: "facelift",
    name: "Facelift",
    category: "Face",
    tagline: "Restore definition to the jawline and neck — without a pulled look.",
    summary:
      "A facelift lifts and repositions the deeper tissues of the lower face and neck to soften jowls and loose skin. Patients are usually socially comfortable after about two weeks, with results that often last seven to ten years.",
    image: img.faceD,
    facts: { duration: "3–5 hours", anesthesia: "General or IV sedation", recovery: "2 weeks", results: "7–10 years" },
    price: { from: 12000, to: 25000 },
    idealFor: [
      "You have jowls or a loss of jawline definition",
      "Loose skin or bands have developed on your neck",
      "Non-surgical treatments no longer give the result you want",
      "You are a non-smoker in good general health",
    ],
    timeline: [
      { when: "Days 1–7", what: "Swelling and bruising peak; dressings and a drain may be removed." },
      { when: "Week 2", what: "Sutures out; most feel comfortable in public." },
      { when: "Weeks 3–6", what: "Return to exercise; numbness gradually improves." },
      { when: "3–6 months", what: "Tissues settle into a soft, natural final result." },
    ],
    faqs: [
      { question: "Where are the incisions?", answer: "Incisions are hidden in the natural contours in front of and behind the ear and into the hairline, and fade over twelve months." },
      { question: "Can a facelift be combined with eyelid surgery?", answer: "Yes. Many patients combine procedures for a balanced result and a single recovery." },
    ],
  },
  {
    slug: "eyelid-surgery",
    name: "Eyelid surgery",
    category: "Face",
    tagline: "Brighter, more rested-looking eyes.",
    summary:
      "Eyelid surgery (blepharoplasty) removes excess skin and repositions fat around the upper or lower eyelids for a more rested, alert appearance. Recovery is typically seven to ten days, and results are long-lasting.",
    image: img.faceC,
    facts: { duration: "1–2 hours", anesthesia: "Local with sedation", recovery: "7–10 days", results: "Long-lasting" },
    price: { from: 4000, to: 8000 },
    idealFor: [
      "Heavy or hooded upper lids",
      "Puffiness or bags beneath the eyes",
      "People often say you look tired",
      "Excess lid skin affects your field of vision",
    ],
    timeline: [
      { when: "Days 1–3", what: "Cold compresses for swelling; eyes may feel tight or dry." },
      { when: "Day 5–7", what: "Sutures removed; light makeup is possible soon after." },
      { when: "Weeks 2–3", what: "Back to most activities; residual bruising fades." },
      { when: "3 months", what: "Final, refreshed result." },
    ],
    faqs: [
      { question: "Will there be visible scars?", answer: "Upper-lid incisions sit in the natural crease; lower-lid incisions are often placed inside the lid or just beneath the lashes." },
      { question: "Is it covered by insurance?", answer: "Occasionally, when excess skin measurably impairs vision. We can advise after an assessment." },
    ],
  },
  {
    slug: "brow-lift",
    name: "Brow lift",
    category: "Face",
    tagline: "Lift heavy brows and soften forehead lines.",
    summary:
      "A brow lift raises a low or heavy brow and smooths forehead creases, opening up the upper face. Most patients recover in one to two weeks, and results can last ten years or more.",
    image: img.faceB,
    facts: { duration: "1–2 hours", anesthesia: "General or IV sedation", recovery: "1–2 weeks", results: "10+ years" },
    price: { from: 6000, to: 10000 },
    idealFor: [
      "Brows that sit low or droop at the outer edge",
      "Deep horizontal forehead lines",
      "A frown line between the brows",
      "Heaviness that crowds the upper eyelids",
    ],
    timeline: [
      { when: "Week 1", what: "Swelling around the forehead and eyes; keep your head elevated." },
      { when: "Week 2", what: "Sutures or clips removed; return to work." },
      { when: "Weeks 3–6", what: "Exercise resumes; any scalp numbness improves." },
      { when: "3 months", what: "Final, natural-looking brow position." },
    ],
    faqs: [
      { question: "Will I look surprised?", answer: "No. The brow is lifted conservatively to a natural position that suits your face." },
      { question: "Is a brow lift done endoscopically?", answer: "Often, yes — small incisions within the hairline allow a shorter recovery for suitable candidates." },
    ],
  },

  // ── Breast ────────────────────────────────────────────────────────────
  {
    slug: "breast-augmentation",
    name: "Breast augmentation",
    category: "Breast",
    tagline: "Fuller, balanced proportions tailored to your frame.",
    summary:
      "Breast augmentation uses implants or fat transfer to increase breast size and improve shape and symmetry. Most patients return to desk work in about one week and avoid heavy lifting for around six weeks.",
    image: img.breastA,
    facts: { duration: "1–2 hours", anesthesia: "General", recovery: "1 week", results: "Long-lasting*" },
    price: { from: 6500, to: 12000 },
    idealFor: [
      "You’d like more volume or upper-breast fullness",
      "Your breasts are noticeably asymmetric",
      "You’ve lost volume after pregnancy or weight loss",
      "You are at a stable weight and in good health",
    ],
    timeline: [
      { when: "Days 1–3", what: "Tightness and soreness; a support bra is worn day and night." },
      { when: "Week 1", what: "Return to desk work and light daily activity." },
      { when: "Week 6", what: "Cleared for full exercise and lifting." },
      { when: "3–6 months", what: "Implants settle into their final, natural position." },
    ],
    faqs: [
      { question: "Do breast implants last forever?", answer: "*Implants are not lifetime devices. Many last 10–15 years or longer, and we monitor them with regular check-ups." },
      { question: "Can I breastfeed after augmentation?", answer: "Most women can. Incision placement and technique are planned with future breastfeeding in mind." },
    ],
  },
  {
    slug: "breast-lift",
    name: "Breast lift",
    category: "Breast",
    tagline: "Restore a lifted, youthful breast position.",
    summary:
      "A breast lift (mastopexy) raises and reshapes breasts that have lost firmness, and can reposition the nipple and areola. Recovery is typically one to two weeks; results are long-lasting, though pregnancy and weight change can affect them.",
    image: img.breastB,
    facts: { duration: "2–3 hours", anesthesia: "General", recovery: "1–2 weeks", results: "Long-lasting" },
    price: { from: 8000, to: 14000 },
    idealFor: [
      "Breasts that sit lower or have lost firmness",
      "Nipples that point downward",
      "Changes after pregnancy, breastfeeding or weight loss",
      "You are not planning further pregnancies soon",
    ],
    timeline: [
      { when: "Week 1", what: "Swelling and soreness; surgical bra worn continuously." },
      { when: "Week 2", what: "Return to work and light activity." },
      { when: "Week 6", what: "Exercise resumes; underwire bras allowed." },
      { when: "6–12 months", what: "Scars soften and fade." },
    ],
    faqs: [
      { question: "Can a lift be combined with implants?", answer: "Yes — a lift with augmentation restores both position and volume in one procedure." },
      { question: "Where are the scars?", answer: "Usually around the areola and sometimes vertically beneath it, placed to be hidden by most swimwear." },
    ],
  },
  {
    slug: "breast-reduction",
    name: "Breast reduction",
    category: "Breast",
    tagline: "Lighter, more comfortable and better proportioned.",
    summary:
      "Breast reduction removes excess breast tissue and skin to relieve discomfort and create a smaller, lifted shape. Most patients return to work within two weeks and report immediate relief from neck and shoulder strain.",
    image: img.breastA,
    facts: { duration: "2–4 hours", anesthesia: "General", recovery: "2 weeks", results: "Permanent" },
    price: { from: 8000, to: 15000 },
    idealFor: [
      "Neck, back or shoulder pain from heavy breasts",
      "Bra straps that leave grooves in your shoulders",
      "Difficulty exercising or finding clothes that fit",
      "Skin irritation beneath the breasts",
    ],
    timeline: [
      { when: "Week 1", what: "Rest and support bra; many feel relief immediately." },
      { when: "Week 2", what: "Return to desk work." },
      { when: "Weeks 4–6", what: "Gradual return to exercise." },
      { when: "6–12 months", what: "Final shape; scars continue to fade." },
    ],
    faqs: [
      { question: "Is breast reduction covered by insurance?", answer: "It can be when medically necessary. Our coordinator can help with documentation for your insurer." },
      { question: "Will my results last?", answer: "Removed tissue does not return, though significant weight change or pregnancy can alter size." },
    ],
  },
  {
    slug: "breast-revision",
    name: "Implant revision",
    category: "Breast",
    tagline: "Update, replace or remove previous implants with care.",
    summary:
      "Implant revision replaces, resizes or removes existing breast implants and corrects issues such as capsular contracture or shifting. Recovery is usually one to two weeks, depending on what is involved.",
    image: img.breastB,
    facts: { duration: "1–3 hours", anesthesia: "General", recovery: "1–2 weeks", results: "Long-lasting" },
    price: { from: 7000, to: 15000 },
    idealFor: [
      "Your implants feel firm, have moved or look uneven",
      "You’d like a different size or implant type",
      "Your implants are older and due for review",
      "You’d prefer to have implants removed",
    ],
    timeline: [
      { when: "Week 1", what: "Rest with a support bra; soreness eases daily." },
      { when: "Week 2", what: "Return to desk work." },
      { when: "Week 6", what: "Exercise resumes." },
      { when: "3–6 months", what: "Final settling of the new result." },
    ],
    faqs: [
      { question: "Can you revise implants placed elsewhere?", answer: "Yes. Bring any records you have about your existing implants to your consultation." },
      { question: "Is implant removal an option?", answer: "Yes — removal can be combined with a lift to restore shape." },
    ],
  },

  // ── Body ──────────────────────────────────────────────────────────────
  {
    slug: "tummy-tuck",
    name: "Tummy tuck",
    category: "Body",
    tagline: "A flatter, firmer abdomen and restored core.",
    summary:
      "A tummy tuck (abdominoplasty) removes excess skin and fat and tightens separated abdominal muscles. Plan for two to three weeks of limited activity; results are long-lasting with a stable weight.",
    image: img.bodyA,
    facts: { duration: "2–4 hours", anesthesia: "General", recovery: "2–3 weeks", results: "Long-lasting" },
    price: { from: 8000, to: 16000 },
    idealFor: [
      "Loose skin on the abdomen after pregnancy or weight loss",
      "Separated abdominal muscles (diastasis recti)",
      "A lower-belly bulge that doesn’t respond to exercise",
      "You are at or near a stable weight",
    ],
    timeline: [
      { when: "Week 1", what: "Walk slightly bent, wear a compression garment, rest often." },
      { when: "Weeks 2–3", what: "Stand straighter; return to desk work." },
      { when: "Week 6", what: "Cleared for exercise and lifting." },
      { when: "6–12 months", what: "Final contour; scar fades low on the abdomen." },
    ],
    faqs: [
      { question: "Where is the scar?", answer: "Low across the abdomen, typically hidden beneath underwear or swimwear." },
      { question: "Should I finish having children first?", answer: "It’s usually best to wait, as a future pregnancy can stretch the muscles and skin again." },
    ],
  },
  {
    slug: "liposuction",
    name: "Liposuction",
    category: "Body",
    tagline: "Refine stubborn areas that resist diet and exercise.",
    summary:
      "Liposuction permanently removes fat cells from specific areas such as the abdomen, flanks or thighs to improve body contour. It is not a weight-loss treatment; most people return to work within a week, with final results at three to six months.",
    image: img.bodyB,
    facts: { duration: "1–3 hours", anesthesia: "General or local", recovery: "3–7 days", results: "Permanent*" },
    price: { from: 4000, to: 10000 },
    idealFor: [
      "Localized fat that persists despite exercise",
      "Good skin elasticity",
      "You are within about 30% of your ideal weight",
      "You want contouring rather than weight loss",
    ],
    timeline: [
      { when: "Days 1–3", what: "Compression garment; soreness similar to a hard workout." },
      { when: "Week 1", what: "Return to work and walking." },
      { when: "Weeks 3–4", what: "Exercise resumes." },
      { when: "3–6 months", what: "Swelling resolves; final contour appears." },
    ],
    faqs: [
      { question: "Can fat come back after liposuction?", answer: "*Removed fat cells don’t return, but remaining cells can grow with significant weight gain." },
      { question: "Does liposuction tighten skin?", answer: "Only modestly. If skin is loose, a tummy tuck or lift may be recommended instead or as well." },
    ],
  },
  {
    slug: "mommy-makeover",
    name: "Mommy makeover",
    category: "Body",
    tagline: "A tailored combination to restore your pre-pregnancy shape.",
    summary:
      "A mommy makeover combines procedures — commonly a tummy tuck, breast lift or augmentation, and liposuction — to address changes after pregnancy in one surgery. Expect two to three weeks of recovery with help at home.",
    image: img.bodyA,
    facts: { duration: "4–6 hours", anesthesia: "General", recovery: "2–3 weeks", results: "Long-lasting" },
    price: { from: 15000, to: 30000 },
    idealFor: [
      "Changes to both the breasts and abdomen after pregnancy",
      "You have finished having children",
      "You’d prefer one recovery instead of several",
      "You have support at home for the first weeks",
    ],
    timeline: [
      { when: "Week 1", what: "Rest with help at home; compression and support garments." },
      { when: "Weeks 2–3", what: "Gradually more mobile; return to desk work." },
      { when: "Week 6", what: "Cleared for lifting children and exercise." },
      { when: "6–12 months", what: "Final results as everything settles." },
    ],
    faqs: [
      { question: "Which procedures are included?", answer: "It’s fully personalized. Your plan is designed around your goals at consultation." },
      { question: "Is it safe to combine procedures?", answer: "For healthy patients in an accredited facility, yes — we carefully limit total operating time." },
    ],
  },
  {
    slug: "arm-lift",
    name: "Arm lift",
    category: "Body",
    tagline: "Smoother, more toned upper arms.",
    summary:
      "An arm lift (brachioplasty) removes loose skin and fat from the upper arms, often after significant weight loss. Most patients recover in one to two weeks, with a scar along the inner arm that fades over time.",
    image: img.bodyB,
    facts: { duration: "2–3 hours", anesthesia: "General", recovery: "1–2 weeks", results: "Long-lasting" },
    price: { from: 7000, to: 12000 },
    idealFor: [
      "Loose, hanging skin on the upper arms",
      "Significant weight loss that has left excess skin",
      "Skin laxity that exercise can’t improve",
      "A stable weight for at least six months",
    ],
    timeline: [
      { when: "Week 1", what: "Compression sleeves; keep arms elevated." },
      { when: "Week 2", what: "Return to light activity and desk work." },
      { when: "Weeks 4–6", what: "Exercise resumes." },
      { when: "12 months", what: "Scar softens and fades." },
    ],
    faqs: [
      { question: "Where is the scar?", answer: "Along the inner or back of the upper arm, positioned to be least visible." },
      { question: "Can liposuction alone help?", answer: "If skin is firm, sometimes. Loose skin usually needs an arm lift for a smooth result." },
    ],
  },

  // ── Non-surgical ──────────────────────────────────────────────────────
  {
    slug: "injectables",
    name: "Neuromodulators",
    category: "Non-surgical",
    tagline: "Soften expression lines in a lunchtime visit.",
    summary:
      "Neuromodulator injections relax the muscles that cause frown lines, forehead lines and crow’s feet. Treatment takes about fifteen minutes with no downtime, and results last three to four months.",
    image: img.skinA,
    facts: { duration: "10–15 minutes", anesthesia: "None needed", recovery: "None", results: "3–4 months" },
    price: { from: 400, to: 1200 },
    idealFor: [
      "Frown lines between the brows",
      "Horizontal forehead lines",
      "Crow’s feet around the eyes",
      "Preventive treatment for early lines",
    ],
    timeline: [
      { when: "Same day", what: "Back to your day immediately; avoid lying down for 4 hours." },
      { when: "Days 3–5", what: "Effects begin to appear." },
      { when: "Day 14", what: "Full result; complimentary review." },
      { when: "3–4 months", what: "Gradual return of movement; time to retreat." },
    ],
    faqs: [
      { question: "Will I still look like myself?", answer: "Yes. We treat conservatively so you keep natural expression." },
      { question: "Who performs injections?", answer: "Injections are performed by our medical team under Dr. Marsh’s supervision." },
    ],
  },
  {
    slug: "fillers",
    name: "Dermal fillers",
    category: "Non-surgical",
    tagline: "Restore volume and definition — subtly.",
    summary:
      "Dermal fillers use hyaluronic acid gels to restore lost volume to the cheeks, lips and under-eyes and soften deeper folds. Most people have only one to two days of mild swelling, with results lasting six to eighteen months.",
    image: img.skinB,
    facts: { duration: "30–45 minutes", anesthesia: "Topical or local", recovery: "1–2 days", results: "6–18 months" },
    price: { from: 700, to: 2000 },
    idealFor: [
      "Volume loss in the cheeks or temples",
      "Thin or uneven lips",
      "Hollows beneath the eyes",
      "Deep smile lines",
    ],
    timeline: [
      { when: "Same day", what: "Mild swelling or tenderness; avoid strenuous exercise." },
      { when: "Days 1–2", what: "Swelling settles." },
      { when: "Week 2", what: "Final result; review appointment." },
      { when: "6–18 months", what: "Gradual, natural breakdown of the filler." },
    ],
    faqs: [
      { question: "Can fillers be reversed?", answer: "Hyaluronic acid fillers can be dissolved if needed — one reason we use them." },
      { question: "Will it look overdone?", answer: "Our approach is to restore, not exaggerate. Treatment is often staged over two visits." },
    ],
  },
  {
    slug: "laser",
    name: "Laser resurfacing",
    category: "Non-surgical",
    tagline: "Smoother texture, more even tone.",
    summary:
      "Laser resurfacing improves fine lines, sun damage, uneven pigment and texture by stimulating new collagen. Downtime ranges from three to ten days depending on intensity, and results last for years with good sun protection.",
    image: img.skinC,
    facts: { duration: "30–90 minutes", anesthesia: "Topical or local", recovery: "3–10 days", results: "Years*" },
    price: { from: 1500, to: 5000 },
    idealFor: [
      "Fine lines and wrinkles",
      "Sun spots and uneven pigmentation",
      "Acne scars or rough texture",
      "Dull, tired-looking skin",
    ],
    timeline: [
      { when: "Days 1–3", what: "Redness and a sunburn-like feeling; gentle skincare routine." },
      { when: "Days 4–10", what: "Skin peels to reveal fresher skin underneath." },
      { when: "Weeks 2–4", what: "Redness fades; makeup can be worn." },
      { when: "3–6 months", what: "Collagen builds for continued improvement." },
    ],
    faqs: [
      { question: "How many sessions will I need?", answer: "Lighter treatments may be repeated two to three times; deeper resurfacing is often a single session." },
      { question: "Is laser safe for all skin tones?", answer: "Many lasers can be used safely across skin tones. Settings are chosen after a skin assessment." },
    ],
  },
  {
    slug: "facials",
    name: "Medical facials",
    category: "Non-surgical",
    tagline: "Clinical-grade skin health, maintained.",
    summary:
      "Medical facials combine deep cleansing, exfoliation and targeted serums to improve clarity, hydration and glow. There is no downtime, and results are best maintained with a monthly treatment.",
    image: img.skinD,
    facts: { duration: "45–60 minutes", anesthesia: "None", recovery: "None", results: "4–6 weeks" },
    price: { from: 150, to: 400 },
    idealFor: [
      "Congested or dull skin",
      "Preparing skin before an event",
      "Maintaining results after laser or surgery",
      "A regular skin-health routine",
    ],
    timeline: [
      { when: "Same day", what: "Fresh, hydrated skin; return to normal activities." },
      { when: "Week 1", what: "Clearer texture as skin renews." },
      { when: "Weeks 4–6", what: "Ideal time for your next treatment." },
      { when: "Ongoing", what: "Cumulative improvement with a regular plan." },
    ],
    faqs: [
      { question: "How is this different from a spa facial?", answer: "Medical facials use clinical-strength products and are tailored by our medical team to your skin." },
      { question: "Can I have one before an event?", answer: "Yes — ideally three to five days before, so skin is at its best." },
    ],
  },
];

export const getProcedure = (slug: string) => procedures.find((p) => p.slug === slug);

export const proceduresIn = (category: Category) => procedures.filter((p) => p.category === category);

export const formatPrice = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k` : `$${n}`;

/** Rough monthly estimate for display only (60 months, ~9.9% APR) — never a quote. */
export const monthlyFrom = (price: number) => {
  const r = 0.099 / 12;
  const n = 60;
  return Math.round((price * r) / (1 - (1 + r) ** -n));
};
