import Link from "next/link";
import { ArrowRight, FilePlus2, ImageUp, LayoutTemplate, MessageSquarePlus, Plus } from "lucide-react";
import { formatDateTime } from "@/lib/admin/format";
import type { WebsiteOverview as Data } from "@/lib/admin/overview";
import { cn } from "@/lib/utils";

const quickActions = [
  { href: "/admin/content/journal/new", label: "New post", icon: FilePlus2 },
  { href: "/admin/content/pages/new", label: "New page", icon: LayoutTemplate },
  { href: "/admin/media", label: "Upload images", icon: ImageUp },
  { href: "/admin/reviews/new", label: "Add review", icon: MessageSquarePlus },
  { href: "/admin/gallery/new", label: "New gallery case", icon: Plus },
];

function Card({ title, count, href, children }: { title: string; count?: number; href?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col rounded-sm border border-line p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-lg">
          {title}
          {count != null && <span className="ml-2 text-sm text-stone tabular-nums">{count}</span>}
        </h2>
        {href && (
          <Link href={href} className="inline-flex items-center gap-1 text-sm text-bronze hover:underline">
            View all <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-stone">{children}</p>;

function Row({ href, title, meta }: { href?: string; title: string; meta?: React.ReactNode }) {
  const inner = (
    <>
      <span className={cn("block text-sm text-ink", href && "group-hover:text-bronze")}>{title}</span>
      {meta && <span className="block text-xs text-stone">{meta}</span>}
    </>
  );
  return (
    <li className="py-2 first:pt-0 last:pb-0">
      {href ? (
        <Link href={href} className="group block">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </li>
  );
}

const stars = (n: number) => `${"★".repeat(n)}${"☆".repeat(5 - n)}`;

/** Start screen for editors: what's waiting for them, and what changed recently. */
export function WebsiteOverview({ data }: { data: Data }) {
  return (
    <div className="space-y-6">
      <nav aria-label="Quick actions" className="flex flex-wrap gap-2">
        {quickActions.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-2 rounded-sm border border-line px-3 py-2 text-sm text-ink transition-colors hover:border-ink/40 hover:bg-cream"
          >
            <Icon className="size-4 text-bronze" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Unpublished drafts" count={data.totals.drafts} href="/admin/content">
          {data.drafts.length === 0 ? (
            <Empty>No drafts waiting. Everything saved is live.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {data.drafts.map((d) => (
                <Row
                  key={`${d.label}-${d.href}`}
                  href={d.href}
                  title={d.label}
                  meta={[d.updatedAt && `Saved ${formatDateTime(d.updatedAt)}`, d.by && `by ${d.by}`].filter(Boolean).join(" ")}
                />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Reviews to check" count={data.totals.reviewsWaiting} href="/admin/reviews?status=pending">
          {data.reviews.length === 0 ? (
            <Empty>No reviews waiting.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {data.reviews.map((r) => (
                <Row
                  key={r.id}
                  href={`/admin/reviews/${r.id}`}
                  title={r.name}
                  meta={
                    <>
                      <span className="text-bronze" aria-label={`${r.rating} out of 5 stars`}>
                        {stars(r.rating)}
                      </span>{" "}
                      · added {formatDateTime(r.createdAt)}
                    </>
                  }
                />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Gallery cases to finish" count={data.totals.casesWaiting} href="/admin/gallery?status=pending">
          {data.cases.length === 0 ? (
            <Empty>No cases waiting.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {data.cases.map((c) => (
                <Row
                  key={c.id}
                  href={`/admin/gallery/${c.id}`}
                  title={c.label}
                  meta={c.blocker ?? "Ready to publish"}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card title="Recently published">
          {data.recent.length === 0 ? (
            <Empty>Nothing published yet.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {data.recent.map((r) => (
                <Row
                  key={r.id}
                  href={r.href}
                  title={r.label}
                  meta={[formatDateTime(r.at), r.by && `by ${r.by}`].filter(Boolean).join(" ")}
                />
              ))}
            </ul>
          )}
        </Card>
        <Card title="On the website">
          <dl className="grid grid-cols-2 gap-4">
            {[
              ["Gallery cases", data.totals.publishedCases, "/admin/gallery?status=approved"],
              ["Reviews", data.totals.publishedReviews, "/admin/reviews?status=approved"],
              ["Images", data.totals.media, "/admin/media"],
            ].map(([label, n, href]) => (
              <div key={label as string}>
                <dt className="text-xs text-stone">{label}</dt>
                <dd>
                  <Link href={href as string} className="font-heading text-2xl tabular-nums hover:text-bronze">
                    {n}
                  </Link>
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}

/** Compact one-line version for the admin dashboard. */
export function WebsiteStrip({ data }: { data: Data }) {
  const items = [
    { label: "drafts unpublished", n: data.totals.drafts, href: "/admin/content" },
    { label: "reviews to check", n: data.totals.reviewsWaiting, href: "/admin/reviews?status=pending" },
    { label: "gallery cases to finish", n: data.totals.casesWaiting, href: "/admin/gallery?status=pending" },
  ];
  return (
    <section aria-labelledby="website-strip" className="rounded-sm border border-line p-4">
      <h2 id="website-strip" className="mb-2 text-xs tracking-wide text-stone uppercase">
        Website
      </h2>
      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {items.map((i) => (
          <li key={i.label}>
            <Link href={i.href} className={cn("hover:underline", i.n > 0 ? "text-ink" : "text-stone")}>
              <strong className="font-medium tabular-nums">{i.n}</strong> {i.label}
            </Link>
          </li>
        ))}
        <li className="sm:ml-auto">
          <Link href="/admin?view=website" className="inline-flex items-center gap-1 text-bronze hover:underline">
            Website overview <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </li>
      </ul>
    </section>
  );
}
