// Journal articles. Shaped like the `blog_posts` table (markdown body) so the admin blog editor
// can take over later. General education only — not medical advice.

import type { Img } from "./home";

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const journalCategories = ["Guides", "Recovery", "Wellness", "Non-surgical"] as const;
export type JournalCategory = (typeof journalCategories)[number];

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: JournalCategory;
  publishedAt: string; // ISO date
  readTime: string;
  image: Img;
  /** Procedure slugs this article relates to (links to /procedures/[slug]) */
  relatedProcedures: string[];
  /** Markdown */
  content: string;
};

export const posts: Post[] = [
  {
    slug: "rhinoplasty-recovery-week-by-week",
    title: "Rhinoplasty recovery: a realistic week-by-week guide",
    excerpt: "What the first days, weeks and months after nose surgery actually feel like — and how to make recovery smoother.",
    category: "Recovery",
    publishedAt: "2026-11-10",
    readTime: "6 min read",
    image: { src: unsplash("1570172619644-dfd03ed5d881"), alt: "Aesthetician applying a treatment mask during a facial" },
    relatedProcedures: ["rhinoplasty"],
    content: `Rhinoplasty recovery is gradual. Most people feel ready for desk work within one to two weeks, but the final shape of the nose continues to refine for up to a year. Knowing what to expect at each stage makes the process far less stressful.

## The first week

Expect a splint on the outside of your nose, congestion and some bruising around the eyes. Pressure is more common than pain. Sleep with your head elevated, use cold compresses on your cheeks (never directly on the nose), and keep to the medication plan you’re given.

- Avoid blowing your nose
- Sneeze with your mouth open
- Skip bending, lifting and exercise

## Weeks two and three

The splint usually comes off around day seven. Your nose will look swollen and slightly upturned — that’s normal. Bruising fades quickly now, and most patients return to work and social plans.

## Weeks four to six

Light exercise can resume once you’re cleared. Glasses should still rest on your cheeks rather than the bridge. Photos start to look natural, even though swelling is still settling, particularly at the tip.

## Three to twelve months

The last swelling — usually at the tip — resolves slowly. This is when the refined, final result appears. Patience here is part of the process.

> The best results come from following your aftercare plan precisely and attending every follow-up. Small things, like sun protection and not wearing heavy glasses, really matter.

## When to call us

Call your care team if you notice increasing pain, a fever, or bleeding that doesn’t settle with gentle pressure. You’ll always have a direct number during recovery.`,
  },
  {
    slug: "fillers-or-surgery",
    title: "Fillers or surgery? How to choose the right option",
    excerpt: "Both can refresh your appearance. The right choice depends on your goals, your anatomy and how long you want results to last.",
    category: "Guides",
    publishedAt: "2026-10-28",
    readTime: "5 min read",
    image: { src: unsplash("1596755389378-c31d21fd1273"), alt: "Woman with a cream face mask holding half an avocado" },
    relatedProcedures: ["fillers", "facelift", "injectables"],
    content: `Non-surgical treatments have changed what’s possible without an operation — but they aren’t always the best answer. Here’s how we help patients decide.

## What fillers do well

Hyaluronic acid fillers restore **volume**. They work beautifully for hollow cheeks, thin lips, under-eye hollows and softening deeper smile lines. Results appear immediately, downtime is minimal and treatment is reversible.

## Where surgery is better

Fillers can’t lift loose skin or reposition tissue that has descended. When jowls, neck laxity or heavy eyelid skin are the main concern, adding volume can make the face look heavier rather than younger. That’s where a facelift or eyelid surgery gives a more natural result.

## Questions to ask yourself

1. Is my concern **volume loss** or **sagging**?
2. How long do I want results to last — months, or years?
3. How much downtime can I realistically take?
4. Am I comfortable with ongoing maintenance appointments?

## The honest middle ground

Many patients benefit from both over time: neuromodulators and fillers in their thirties and forties, and a surgical refresh later. A good consultation should explain all options — including when to wait.`,
  },
  {
    slug: "preparing-your-body-for-surgery",
    title: "Preparing your body for surgery: 8 things that matter",
    excerpt: "Simple steps in the weeks before surgery can make a real difference to your safety, healing and results.",
    category: "Wellness",
    publishedAt: "2026-10-14",
    readTime: "7 min read",
    image: { src: unsplash("1518611012118-696072aa579a"), alt: "Women exercising on yoga mats in a bright studio" },
    relatedProcedures: ["tummy-tuck", "breast-augmentation", "mommy-makeover"],
    content: `The weeks before surgery are an opportunity. What you do now affects how you heal later.

## 1. Stop smoking and vaping

Nicotine narrows blood vessels and significantly increases the risk of wound-healing problems. We ask patients to stop at least four to six weeks before and after surgery.

## 2. Review your medications

Some medications and supplements — including aspirin, ibuprofen, fish oil, vitamin E and certain herbal remedies — increase bleeding. Share a full list with your care team.

## 3. Reach a stable weight

Results last best when your weight is stable. Major weight change after body contouring can affect your outcome.

## 4. Eat for healing

Prioritize protein, fruit and vegetables, and stay well hydrated. Your body needs building blocks to repair tissue.

## 5. Keep moving

Regular walking improves circulation and makes recovery easier. Intense new routines can wait until after.

## 6. Arrange help at home

Plan for someone to drive you home and stay with you for at least the first night — longer for larger procedures.

## 7. Prepare your recovery space

Set up pillows, loose clothing, water and medications within easy reach before surgery day.

## 8. Ask every question

There are no silly questions. Understanding the plan reduces anxiety and helps you heal.`,
  },
  {
    slug: "choosing-breast-implants",
    title: "Choosing breast implants: size, shape and profile explained",
    excerpt: "Why the ‘right’ implant is about your frame and tissue — not just cup size.",
    category: "Guides",
    publishedAt: "2026-09-30",
    readTime: "6 min read",
    image: { src: unsplash("1522337360788-8b13dee7a37e"), alt: "Woman in a white sweater seen from behind, hands in her hair" },
    relatedProcedures: ["breast-augmentation", "breast-revision"],
    content: `Choosing an implant can feel overwhelming. In practice, your anatomy narrows the options considerably — and that’s a good thing.

## Your measurements come first

Chest width, existing breast tissue and skin elasticity determine which implants will look natural on you. An implant that’s too wide or too projecting for your frame is the most common cause of an unnatural result.

## Shape: round or teardrop

Round implants give fullness to the upper breast. Anatomical (teardrop) implants are fuller at the bottom and can suit patients with very little tissue. Both can look natural when chosen carefully.

## Profile

Profile describes how far an implant projects forward. Higher profiles add projection without extra width — useful for narrower chests.

## Silicone or saline

Modern cohesive silicone gel feels most like natural tissue. Saline implants use a smaller incision and are filled after placement.

## Trying sizes

At your consultation you can try sizers and view 3D imaging to see realistic options. Bring photos of results you like — and ones you don’t.

> Implants are not lifetime devices. Plan for regular check-ups and possible replacement in the future.`,
  },
  {
    slug: "what-to-expect-neuromodulators",
    title: "Your first neuromodulator treatment: what to expect",
    excerpt: "A quick, comfortable treatment — but a few simple tips make results look their best.",
    category: "Non-surgical",
    publishedAt: "2026-09-16",
    readTime: "4 min read",
    image: { src: unsplash("1552693673-1bf958298935"), alt: "Clinician performing a skin treatment on a relaxed patient" },
    relatedProcedures: ["injectables"],
    content: `Neuromodulators soften expression lines by relaxing specific muscles. Treatment takes minutes, but planning makes the difference between natural and frozen.

## Before your appointment

Avoid alcohol and blood-thinning supplements for a couple of days to reduce bruising. Arrive with clean skin.

## During treatment

Your injector will ask you to frown, smile and raise your brows to map your muscles. Tiny injections feel like a quick pinch.

## Afterwards

- Stay upright for four hours
- Avoid strenuous exercise for the rest of the day
- Don’t massage the treated areas

## When you’ll see results

Effects begin in three to five days and peak around two weeks, when we invite you back for a review. Results typically last three to four months.`,
  },
  {
    slug: "tummy-tuck-vs-liposuction",
    title: "Tummy tuck vs. liposuction: which do you need?",
    excerpt: "They’re often confused, but they solve different problems. Here’s how to tell which fits your goals.",
    category: "Guides",
    publishedAt: "2026-09-02",
    readTime: "5 min read",
    image: { src: unsplash("1571019613454-1cb2f99b2d8b"), alt: "Woman doing a core exercise on a mat in a bright studio" },
    relatedProcedures: ["tummy-tuck", "liposuction"],
    content: `Both procedures improve the abdomen, but they address different concerns.

## Liposuction removes fat

If your skin is firm and your concern is a stubborn area of fat, liposuction can sculpt a smoother contour with a shorter recovery.

## A tummy tuck removes skin — and repairs muscle

After pregnancy or significant weight loss, the issue is often loose skin and separated abdominal muscles. No amount of fat removal will tighten these; a tummy tuck does.

## A simple self-check

Gently pinch the skin below your belly button. If there’s a lot of loose, crepey skin — or a bulge that remains when you tense your core — a tummy tuck is more likely to help.

## Sometimes, both

Many tummy tucks include liposuction of the flanks for a more refined waistline. Your consultation will clarify which approach gives the result you want.`,
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);

export const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
