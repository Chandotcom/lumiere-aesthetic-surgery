// Static demo content for the homepage. Fictional practice — not real patients or results.
// Photos: Unsplash (https://unsplash.com/license). Never use real before/after patient photos here.

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

export type Img = { src: string; alt: string };

export const images = {
  hero: { src: unsplash("1531746020798-e6953c6e8e04"), alt: "Portrait of a woman with natural makeup against a soft blush background" },
  statement: { src: unsplash("1515377905703-c4788e51af15"), alt: "Hands holding a dropper of facial serum over an open palm" },
  surgeon: { src: unsplash("1559839734-2b71ea197ec2"), alt: "Portrait of a smiling female physician in a white coat" },
  journey: { src: unsplash("1631217868264-e5b90bb7e133"), alt: "Physician talking warmly with a patient during a consultation" },
  finalCta: { src: unsplash("1616394584738-fc6e612e71b9"), alt: "Woman relaxing during a calming skin treatment" },
} as const satisfies Record<string, Img>;

// ── Navigation ──────────────────────────────────────────────────────────
export const navLinks = [
  { label: "Gallery", href: "/gallery" },
  { label: "About", href: "/about" },
  { label: "Journal", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

// ── Procedures ──────────────────────────────────────────────────────────
export type ServiceGroup = {
  category: string;
  href: string;
  blurb: string;
  image: Img;
  procedures: { name: string; href: string }[];
};

const p = (name: string, slug: string) => ({ name, href: `/procedures/${slug}` });

export const serviceGroups: ServiceGroup[] = [
  {
    category: "Face",
    href: "/procedures#face",
    blurb: "Subtle refinements that keep your features unmistakably yours.",
    image: { src: unsplash("1531123897727-8f129e1688ce"), alt: "Close portrait of a woman with glowing skin" },
    procedures: [p("Rhinoplasty", "rhinoplasty"), p("Facelift", "facelift"), p("Eyelid surgery", "eyelid-surgery"), p("Brow lift", "brow-lift")],
  },
  {
    category: "Breast",
    href: "/procedures#breast",
    blurb: "Proportion and shape tailored to your frame and goals.",
    image: { src: unsplash("1522337360788-8b13dee7a37e"), alt: "Woman in a white sweater seen from behind, hands in her hair" },
    procedures: [p("Breast augmentation", "breast-augmentation"), p("Breast lift", "breast-lift"), p("Breast reduction", "breast-reduction"), p("Implant revision", "breast-revision")],
  },
  {
    category: "Body",
    href: "/procedures#body",
    blurb: "Contouring that restores definition after life’s changes.",
    image: { src: unsplash("1571019613454-1cb2f99b2d8b"), alt: "Woman doing a core exercise on a mat in a bright studio" },
    procedures: [p("Tummy tuck", "tummy-tuck"), p("Liposuction", "liposuction"), p("Mommy makeover", "mommy-makeover"), p("Arm lift", "arm-lift")],
  },
  {
    category: "Non-surgical",
    href: "/procedures#non-surgical",
    blurb: "Refresh without downtime, guided by a medical team.",
    image: { src: unsplash("1552693673-1bf958298935"), alt: "Clinician performing a skin treatment on a relaxed patient" },
    procedures: [p("Neuromodulators", "injectables"), p("Dermal fillers", "fillers"), p("Laser resurfacing", "laser"), p("Medical facials", "facials")],
  },
];

export const marquee = serviceGroups.flatMap((g) => g.procedures.map((x) => x.name));

// ── Proof ───────────────────────────────────────────────────────────────
export const stats = [
  { value: "15", suffix: "+", label: "Years of surgical experience" },
  { value: "4,000", suffix: "+", label: "Procedures performed" },
  { value: "4.9", suffix: "/5", label: "Average patient rating" },
  { value: "98", suffix: "%", label: "Would recommend us to a friend" },
] as const;

export const credentials = [
  "Certified by the American Board of Plastic Surgery (demo)",
  "Fellowship-trained in aesthetic surgery",
  "Member, American Society of Plastic Surgeons (demo)",
  "Operates only in accredited surgical facilities",
];

// ── Journey ─────────────────────────────────────────────────────────────
export const journey = [
  { title: "Private consultation", text: "An unhurried hour with Dr. Marsh — in person or virtual — to talk goals, anatomy and options." },
  { title: "Your personal plan", text: "Clear recommendations, realistic outcomes, all-inclusive pricing and financing options in writing." },
  { title: "Procedure day", text: "Accredited facility, board-certified anesthesia, and a dedicated nurse with you throughout." },
  { title: "Recovery & beyond", text: "Scheduled follow-ups, a direct line to the team, and check-ins for a full year." },
];

// ── Testimonials (labelled “Sample reviews” in the UI — FTC rules) ──────
export type Testimonial = { quote: string; name: string; procedure: string; image: Img };

export const testimonials: Testimonial[] = [
  {
    quote: "I felt listened to from the very first visit. The result looks like me on my best day — nobody can tell, they just say I look rested.",
    name: "Sarah M.",
    procedure: "Facelift",
    image: { src: unsplash("1508214751196-bcfd4ca60f91"), alt: "Smiling woman outdoors in warm evening light" },
  },
  {
    quote: "Every question was answered before I asked it. Recovery was exactly as described, and the team checked on me constantly.",
    name: "Jessica R.",
    procedure: "Breast augmentation",
    image: { src: unsplash("1494790108377-be9c29b29330"), alt: "Laughing woman with long dark hair in a red sweater" },
  },
  {
    quote: "Calm, honest, and never pushy. They even talked me out of a procedure I didn’t need. That’s exactly why I trust them.",
    name: "Amara O.",
    procedure: "Rhinoplasty",
    image: { src: unsplash("1524504388940-b1c1722653e1"), alt: "Portrait of a woman with long hair against a dark background" },
  },
];

// ── FAQ (also emitted as FAQPage JSON-LD for search + AI answer engines) ─
export const faqs = [
  {
    question: "How do I know if I’m a good candidate for plastic surgery?",
    answer: "Good candidates are in stable health, don’t smoke (or will stop before and after surgery), and have realistic goals. Your consultation includes a medical review so Dr. Marsh can recommend what is safe and appropriate for you.",
  },
  {
    question: "How much does a procedure cost?",
    answer: "Costs depend on the procedure and your plan. As a guide, rhinoplasty ranges from about $7,000 to $15,000 and breast augmentation from $6,500 to $12,000. You receive an all-inclusive written quote after your consultation.",
  },
  {
    question: "Do you offer financing?",
    answer: "Yes. We work with patient-financing partners offering monthly plans, with some options starting at 0% interest for qualified applicants. Our coordinator can walk you through choices before you commit.",
  },
  {
    question: "What is recovery like?",
    answer: "It varies by procedure. Many patients return to desk work after one to two weeks, with swelling settling over several months. You’ll receive a written recovery plan and direct access to our nursing team.",
  },
  {
    question: "Can I have a virtual consultation?",
    answer: "Yes. Virtual consultations are available for most procedures and are ideal for out-of-town patients. A final in-person exam takes place before any surgery.",
  },
];
