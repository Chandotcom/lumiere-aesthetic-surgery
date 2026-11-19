# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

The tech stack is scaffolded: config, DB schema, auth proxy, SEO routes and placeholder pages.
Feature pages are not built yet. The build plan lives at
`C:\Users\Christian\.claude\plans\for-this-project-are-agile-thunder.md`.
**This is Next.js 16** with `cacheComponents` and `partialPrefetching` on, and the APIs differ from older versions.
Read `AGENTS.md` and the docs in `node_modules/next/dist/docs/` before writing Next code.
Middleware is now `src/proxy.ts`. Dynamic data (DB, `auth()`) must sit inside `<Suspense>`, and you must call `await connection()` or use `'use cache'`.

## Commands

- **Package manager: pnpm** (pinned via `packageManager` in package.json). Do not use npm/yarn or commit a `package-lock.json`.
  Install-script approvals live in `pnpm-workspace.yaml` under `allowBuilds` (only `esbuild` is allowed); approve new ones with `pnpm approve-builds <pkg>`.
  Add shadcn components with `pnpm dlx shadcn@latest add <name>`.
- `pnpm dev` / `pnpm build` / `pnpm start`
- `pnpm lint` (ESLint 9 + React Compiler rules, which forbid JSX inside try/catch) and `pnpm typecheck`.
  If typecheck complains about stale `.next/types`, run `pnpm build` first.
- `pnpm db:push` syncs the schema to Neon (dev). `pnpm db:generate` + `pnpm db:migrate` create and apply versioned migrations.
- `pnpm db:seed` seeds procedures. `pnpm db:studio` opens Drizzle Studio.
- Env: copy `.env.example` → `.env.local`, or `vercel env pull .env.local --yes` once the Marketplace integrations exist.
- No test runner is set up yet.

## UI conventions

- shadcn/ui uses the **base-nova** style, built on **Base UI** rather than Radix. Compose with the `render` prop, not `asChild`.
- **Links that look like buttons → `<ButtonLink href="/x">`** (`src/components/ui/button-link.tsx`). **Never** use
  `<Button render={<Link />}>` or `SheetClose render={<Link />}`. Base UI's Button expects a native `<button>` and logs
  errors otherwise, and `nativeButton={false}` would add `role="button"` to links. Use `<Button>` only for real actions
  (submit, open menu). In sheets and dialogs, close them with controlled `open` state and a plain `<Link onClick>`.
- Admin auth: `src/proxy.ts` only runs `clerkMiddleware()`. The sign-in check is `auth.protect()` in `src/app/admin/layout.tsx`
  (`RequireStaff`). Repeat that check in every admin Server Action and API route, because layouts don't protect those.
- **Always import `cn` from `@/lib/utils`**, never from the `cn` package directly. That helper registers our custom tokens
  (`text-label`, `text-h1`…, `tracking-label`, `ease-luxe`). Without it, `text-label` is merged as a *color* and removes the
  button's text color. New shadcn components import from `"cn"`, so change their import after `shadcn add`. When you add a
  new `--text-*` token, register it there too.
- **Motion:** wrap below-the-fold content in `<Reveal>` (`src/components/motion/reveal.tsx`). Variants are `up`, `fade` and `image`
  (a wipe from the bottom), plus `delay` for staggering. The styles live in `globals.css` under `[data-reveal]` and only apply when scripting is
  on and the user hasn't asked for reduced motion. The `image` clip goes on the **child**, because a clipped target never
  intersects. The hero uses CSS-only `motion-safe:animate-in` (tw-animate-css) instead of Reveal, so it never waits for JS (LCP).
- Other high-end utilities: `grain` (film grain on dark sections), `numeral` (01/02 index numbers), `animate-marquee`, and an `<em>`
  inside h1–h3, which renders as a light bronze accent word (sand on `bg-ink`).
- Section rhythm alternates ivory, cream and dark ink. Keep it that way when adding sections. The FAQ section emits FAQPage JSON-LD.
- Homepage content lives in `src/lib/content/home.ts`, and the sections live in `src/components/home/`. The site chrome (header,
  mobile nav, footer, sticky mobile CTA) is in `src/components/site/` and is wired up in `src/app/(site)/layout.tsx`.
- CTA wording: the consultation call to action is always **"Request a consultation"** (not "Book…"). The user chose one consistent label.
- **Consultation flow:** `src/app/(site)/consultation/` holds the page and a server action (`actions.ts`). The form is `src/components/consultation/consultation-form.tsx` (react-hook-form + the shared zod schema in `src/lib/validation/consultation.ts`; always validate on the server too). Without `DATABASE_URL` the action returns `demo: true` and stores nothing. Never log submission contents (they may hold health info). First-touch UTM/referrer data is captured by `AttributionCapture` in the site layout (sessionStorage, no cookies or pixels). Link with `/consultation?procedure=<slug>` to pre-select a procedure.
- **Procedures:** all content lives in `src/lib/content/procedures.ts` (16 procedures, with categories, facts, pricing, candidates, timeline and FAQs). `/procedures` is the index with anchors `#face`, `#breast`, `#body` and `#non-surgical`. `/procedures/[slug]` is prerendered for every slug via `generateStaticParams`, and unknown slugs return `notFound()`. Read `params` inside `<Suspense>` (the `ProcedureContent` pattern) so client navigations stay instant, as Next instant-navigation validation requires. `ProcedureCard` links use `prefetch`. Each detail page emits MedicalProcedure, BreadcrumbList and FAQPage JSON-LD. `serviceGroups` in `home.ts` mirror these slugs, so keep them in sync.
- **Gallery:** `/gallery` lists cases 12 at a time (`PAGE_SIZE`). "Load more" sets `?page=N`, and filters set `?category=` / `?procedure=`, all in the URL. The grid uses static `ThumbPair` thumbnails (no sliders). Each case has its own page, `/gallery/[case]` (slug `<procedure>-<number>`, prerendered), with `CaseViewer` (angle switcher + `CompareSlider`, width capped by viewport height), prev/next and more cases. Both pages sit behind `AgeGate`, which renders nothing until 18+ is confirmed. The confirmation is shared through the `useAgeConfirmed()` hook (sessionStorage), which the homepage `ResultsPreview` also uses, so confirming anywhere unlocks everywhere for the session. Cases are generated in `src/lib/content/gallery.ts`, shaped like `gallery_items`, newest first, to be replaced by DB queries of 12 rows at a time once the admin exists. Demo images are `PlaceholderPhoto` art. **Never** use edited stock photos as "results", and only list `consentSigned` cases.
- **Journal & About:** articles live in `src/lib/content/journal.ts` (Markdown bodies, shaped like `blog_posts`, newest first). `/blog` uses `JournalBrowser` (`?topic=` filter, newest article featured) with a static full-list Suspense fallback. `/blog/[slug]` renders Markdown via `Prose` (`src/components/journal/prose.tsx`, which maps Markdown elements onto the design system, with no typography plugin) and emits BlogPosting JSON-LD, an author box and a "medically reviewed" line. `/about` has Physician JSON-LD, the training timeline (fictional, marked "(demo)") and the team. Inside hairline grids (`gap-px bg-line`), use `<Reveal variant="content">` so cells never flash as a grey block.
- **Misc pages:** `/contact` (MedicalClinic JSON-LD with address and hours; the map is a link-out card, not an embed, so no third-party tracking), plus `/privacy`, `/terms` and `/accessibility`, which all use `LegalPage` (`src/components/legal/legal-page.tsx`: sticky TOC and Markdown sections via `Prose`, with a "demo document" notice; a real clinic needs legal review). `src/app/not-found.tsx` brings its own header and footer because it renders outside the `(site)` layout. `src/app/(site)/error.tsx` uses the Next 16 `retry` prop (not `reset`).
- **Admin:** the layout's `RequireStaff` calls `auth.protect()` and then `getStaff()` (`src/lib/admin/session.ts`, role from Clerk `publicMetadata.role`). Users without a role get a "No staff access" screen. Every Server Action wraps its work in `requireStaff()`, validates with zod, calls `logAudit()` (`src/lib/admin/audit.ts`; record the action, never the lead's data) and then `refresh()` from `next/cache`. Queries live in `src/lib/admin/*.ts` (`server-only`). Values that client components need, like the status labels in `lead-status.ts`, go in a module that isn't server-only. Data reads sit inside `<Suspense>` after `await connection()`. Compute `Date.now()` in the loader, not in render. Without `DATABASE_URL`, admin pages show `<DbNotice>`. The sidebar items live in `src/components/admin/admin-nav.tsx`. **Leads** (`/admin/leads`): status tabs and search in the URL (`?status=`, `?q=`), and a waiting timer (overdue after 24h). Moving a lead off "new" or clicking "Mark responded" sets `firstRespondedAt`. The detail page has notes and assign-to-me. **Dashboard** (`/admin`): the KPI SQL lives in `src/lib/admin/kpis.ts` and uses rolling windows: new leads over 30d vs the previous 30d, average first response over 30d, consult→surgery conversion over 90d, no-show rate over 90d, 12 weeks of leads per week, and leads by source over 90d. The charts are in `src/components/admin/kpi-charts.tsx` (Recharts). Each has one bronze series with no legend, is `aria-hidden`, and comes with a "Show data table" view. Helpers that server code calls must not live in a `"use client"` file, so they go in `src/lib/admin/format.ts`.
- **Admin actions & time:** wrap every admin Server Action in `runStaffAction()` (`src/lib/admin/action.ts`). It handles the staff check, failure logging without PII, and `refresh()`. Throw `ActionError` to show a specific message. **All admin dates use clinic time**: `site.timeZone` (`NEXT_PUBLIC_CLINIC_TIME_ZONE`, default `America/New_York`) through `src/lib/admin/time.ts` (`clinicTimeToDate`, `clinicDayKey`, `formatClinic*`). Never use the server's zone, because Vercel runs in UTC. **Appointments** (`/admin/appointments`): Upcoming/Past (`?view=past`) and a type filter (`?type=`), grouped by clinic day, with a banner for past appointments still "scheduled". Booking happens on the lead page (`BookAppointmentForm`). Booking a consultation moves a new/contacted lead to "consult booked", and booking surgery sets "won". Each row has an outcome select and an inline reschedule form (`src/components/admin/appointment-controls.tsx`).
- **Editable content (CMS):** the public content in `src/lib/content/*` is the **default**. Staff edits are stored in `content_documents` (kind + key, `draft` and `published` jsonb), and each publish snapshots a row in `content_revisions`.
  - **Public reads** go through `readContent(kind)` (`src/lib/cms/read.ts`: `'use cache'`, `cacheLife("max")`, `cacheTag("cms:<kind>")`). Wrappers such as `getProcedures()` / `getProcedureBySlug()` (`src/lib/cms/procedures.ts`) merge the edits over the defaults and ignore stored data that fails the schema.
  - **Publish** calls `updateTag("cms:<kind>")`, so pages stay fully static (30d) and refresh straight away. Every `'use cache'` component on public pages needs an explicit `cacheLife`, because otherwise the default 15-minute window applies to the whole page.
  - **Preview** uses Next Draft Mode. `GET /api/admin/preview?kind&key` is staff-only and redirects only to the registry's `previewPath`. In Draft Mode, `readContent` returns drafts. `PreviewBanner` (cached, in the site layout) shows an "Exit preview" form that posts to `/api/preview/exit`.
  - **To add an editable kind:** add a zod schema in `src/lib/cms/schemas.ts` and an entry in `src/lib/cms/registry.ts` (schema, keys, defaults, previewPath). Add a reader that merges the edits over the defaults, switch the public pages to it, and build an editor from `ContentForm` + `TextField`/`NumberField`/`ImageField`/`ListField` (`src/components/admin/cms/`).
  - Structural fields (slugs, names, categories) stay in code. Image URLs must start with `https://images.unsplash.com/` until Blob uploads exist.
  - **Kinds** (registry `isKey` validates keys):
    - `procedure` (key = slug).
    - `home` / `main`: `getHomeContent()`. Each home section is an async server component that fetches it itself, so `Faq` (with no props), `FinalCta` and `Testimonials` (a server wrapper around the client `TestimonialsCarousel`) work on any page.
    - `settings` / `main`: `getSiteSettings()` for phone, email, address and hours. The site layout passes `phone` to the client chrome (`SiteHeader`, `MobileNav`, `MobileCta`, `ConsultationForm`). The legal pages build their sections from the settings. `error.tsx` keeps `site.phone` (client-only fallback).
    - `seo` / `main`: `seoMetadata(page)` in `generateMetadata` for the 7 main pages.
    - `post` (key = slug): `getPosts()` / `getPostBySlug()` merge built-in articles with published docs, append admin-created posts and drop `visible: false`. New posts are created through `createPost` (slug fixed, `new` reserved). Only custom posts can be deleted. Built-in ones get hidden.
  - **Admin navigation:** the sidebar has **Pages** (`/admin/content`: homepage, contact details, SEO and procedures) and **Journal** (`/admin/content/journal`: post list and "New post"). `AdminNav` highlights the longest matching href, so nested sections don't light up their parent. `BackToContent to="journal"` links back to the Journal list.
  - **Accent headings:** editable headings mark the bronze accent with `*asterisks*`, rendered by `<Accent text>` (`src/components/ds/accent.tsx`, no HTML). Editors share `loadEditorData()` (`src/lib/cms/editor-data.ts`) and `EditorPage`/`EditorSection`. Every default must pass its schema, so re-check after changing limits.
- **Media library** (`/admin/media`, `media` table, public Blob store via `BLOB_READ_WRITE_TOKEN`). Uploads go **browser → Blob directly** with `upload()` from `@vercel/blob/client`, because Server Actions accept only about 1 MB and functions about 4.5 MB.
  - `POST /api/admin/media/upload` (`handleUpload`) gives tokens only to staff, only for image types up to 10 MB and only under `media/`.
  - The browser then calls `registerMedia`, which re-reads the file with `head()` before inserting it. There's no `onUploadCompleted`, because Blob can't call back to localhost.
  - Deleting is refused while a content document still references the URL (`findMediaUsage`), unless the user forces it.
  - `ImageField` includes `MediaPicker`, so every editor gets "Choose from library".
  - Allowed image hosts: `isAllowedImageUrl()` in `src/lib/cms/schemas.ts` (Unsplash + `*.public.blob.vercel-storage.com`). Keep it in sync with `images.remotePatterns`.
  - Patient photos never go in the media library. The gallery will use a separate **private** store.
- **DB driver & fetch cache:** `src/db/index.ts` sets `neonConfig.fetchFunction` to Next's unpatched fetch (`fetch._nextOriginalFetch`). Otherwise Next's implicit build-time fetch cache stores Neon query responses in `.next/cache/fetch-cache` and replays them in later builds, so stale content gets baked into prerendered pages. Don't use `fetchOptions: { cache: "no-store" }` instead, because inside `'use cache'` it breaks prerendering.
- **DB workflow:** `drizzle-kit push` needs an interactive TTY because `strict: true` is set, so it fails in agent shells. Change the schema with `pnpm db:generate` + `pnpm db:migrate` (migrations live in `drizzle/`, so keep that folder). `pnpm db:seed` upserts all 16 procedures from `src/lib/content/procedures.ts` and is safe to re-run. `pnpm db:seed:demo` (`src/db/seed-demo.ts`) replaces the demo data with 150 fictional leads plus appointments over the last 90 days. It is deterministic and dated relative to now, so re-run it before a pitch. `pnpm db:demo:clear` removes them. Demo leads are identified **only** by `@example.com` emails (`isSampleLead()`) and show a "Sample" badge in the admin, so never delete leads by any other criterion.
- Photos are Unsplash URLs (allowed via `images.remotePatterns` in `next.config.ts`). Never use real before/after patient photos
  outside the consent-gated gallery.
- Fonts: Inter (`font-sans`) for body text and **Jost** (`font-heading`, light 300 for big headings, 400 for h3/h4) for headings.
  The user doesn't want serif headings (Cormorant Garamond was rejected), so keep headings in a modern sans-serif.

## Design system

All tokens and utilities live in `src/app/globals.css`. Use them instead of ad-hoc values.

- **Colors:** `ink`, `stone`, `ivory` (page background), `cream` (alternate sections), `sand` (decorative only), `bronze` (the one accent:
  links, buttons, focus), `bronze-deep` (hover), and `line` (hairlines). The shadcn tokens (`primary`, `muted`, `border`, …) map onto these.
  **Never put white text on sand** (1.7:1 contrast). Bronze passes 4.5:1 on ivory and on cream.
- **Type:** headings use the fluid `text-display` / `text-h1`–`text-h4` scale. Body text is 16px with a 1.75 line height. Use `lead` for intros and
  `eyebrow` for small uppercase labels.
- **Layout:** use `container-site` (1200px), `container-wide` (1600px) or `container-prose` (672px), all with a fluid `--gutter`.
  Use `section-y` for vertical rhythm, `stack` for a vertical flow with a 28px gap, `grid-auto` for card grids and `hairline` for 1px borders.
- **Spacing rules:** sections use `section-y` (72px → 112px). A section intro (eyebrow + heading + blurb) gets `section-intro` before its content (48px → 72px). Inside `stack`, an `.eyebrow` sits 14px above its heading automatically. Mark button rows with `data-slot="actions"` for +8px of air. Put padding for `first:`/`nth-child` grid cells on the `<li>`, not on the link inside it.
- **Text + portrait image sections:** use `media-pair` on the grid (centered pair, `md:gap-x-16 lg:gap-x-20`) and `media-pair-img max-md:w-full` on the image wrapper. Never pin a viewport-height-capped image to the far edge of a 12-column grid, because it leaves a big empty gap. Do not put plain `w-full` on the image wrapper: at md+ it collapses the auto column to 0px.
- **Breakpoints:** sm 480, **md 840** (the main layout switch), lg 1024, xl 1280, 2xl 1600.
- **Components:** use the primitives in `src/components/ds`: `Container`, `Section` (tone `default`/`alt`/`dark`),
  `Heading` (`level` and `size` are set separately), `Eyebrow`, `TextLink` (animated underline) and `Split`.
- **Buttons:** variants are `default`, `outline` and `outline-light` (for use over images or dark sections). Marketing pages use the
  sizes `cta` and `cta-lg`, which are uppercase and tracked. The admin keeps the compact default sizes.

## What this is

A **demo / portfolio** website for a **fictional** plastic surgery clinic ("Lumière Aesthetic Surgery",
surgeon "Dr. Elena Marsh, MD"), used to pitch web services to real clinics. It has two halves:

- **Public site**: procedures, a before/after gallery, a blog, a consultation request form, and privacy/accessibility pages.
- **Staff admin dashboard** with **real authentication and a real database**: leads inbox, appointments,
  gallery and reviews moderation, blog posting, KPIs, and staff/audit settings.

The demo is aimed at a **generic/international** market. Show privacy best practices; do not hard-code one country's law.

## Planned stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, deployed on Vercel.
- Neon Postgres (via Vercel Marketplace) + Drizzle ORM. Schema goes in `src/db/schema.ts` and the seed script in `src/db/seed.ts`.
- Clerk for **staff-only** auth (patients never log in). Roles go in `publicMetadata.role` (`admin` | `staff`).
  `src/proxy.ts` runs Clerk **only** on `/admin`, `/sign-in` and `/api/admin`. `ClerkProvider` sits in the admin and sign-in
  layouts, not the root layout, so public pages stay static and work without Clerk keys.
- DB access goes through `getDb()` from `src/db/index.ts`. It connects lazily, so the build works without `DATABASE_URL`.
- The SEO switch is `allowIndexing` in `src/lib/site.ts`, driven by `NEXT_PUBLIC_ALLOW_INDEXING`. It controls root metadata
  robots and `src/app/robots.ts`. JSON-LD builders live in `src/lib/seo/schema.ts`, rendered with `<JsonLd>`.
- Vercel Blob (private) for gallery and blog images.
- react-hook-form + zod for forms, and Server Actions for writes. Recharts for KPI charts. Markdown blog content rendered with `react-markdown`.
- Before provisioning any external service, load the `vercel:marketplace` skill. Env vars come from `vercel env pull`.

## Architecture notes

- Route groups: `src/app/(site)/` for the public site and `src/app/admin/` for the dashboard.
- Data flow: the public `/consultation` form inserts into `leads`. The admin leads inbox shows a "waiting" timer
  (now − `createdAt` until `firstRespondedAt` is set). KPIs on `/admin` are derived from `leads` + `appointments`:
  average response time, consult→surgery conversion, no-show rate, and leads by source.
- Content moderation gates what the public site shows:
  - `gallery_items` appear publicly only when `status = approved`, and approval requires `consentSigned`.
  - `reviews` appear only when published.
  - `blog_posts` appear only when `status = published`.
- Every admin mutation writes a row to `audit_log`.

## Non-negotiable demo rules

- Every page carries a permanent "DEMO — fictional practice, not medical advice" banner and `noindex` robots meta.
- Never use real patient photos, a real clinic's branding, or real credentials. Use stock or AI images, and label seeded reviews "Sample review".
- No third-party tracking pixels on forms or admin pages. Load non-essential scripts only after cookie consent.
- SMS and marketing consent are separate, unchecked checkboxes. The contact form tells users not to include medical details.
- Gallery and testimonials show a "results vary" disclaimer. Never add AI "preview your results" face simulators.
- Accessibility target is WCAG AA: labels, contrast, keyboard navigation, alt text, reduced motion.
