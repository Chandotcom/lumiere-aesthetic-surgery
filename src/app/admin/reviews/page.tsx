import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Plus } from "lucide-react";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { GalleryStatusBadge as StatusBadge } from "@/components/admin/gallery/gallery-status-badge";
import { SampleBadge } from "@/components/admin/lead-status-badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/admin/format";
import { countReviewsByStatus, listReviews } from "@/lib/admin/reviews";
import { getProcedure } from "@/lib/content/procedures";
import { isReviewStatus, REVIEWS_SHOWN, reviewStatusLabel, type ReviewStatus } from "@/lib/reviews/meta";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reviews" };

export default function ReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl">Reviews</h1>
          <p className="mt-1 max-w-2xl text-sm text-stone">
            Patient reviews for the homepage and About page. The {REVIEWS_SHOWN} newest published reviews are shown.
            Publish reviews whatever their rating, and only hide one for a reason from the review policy.
          </p>
        </div>
        <ButtonLink href="/admin/reviews/new" className="self-start sm:self-auto">
          <Plus /> Add review
        </ButtonLink>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ReviewList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function load(status?: ReviewStatus) {
  await connection();
  const [rows, counts] = await Promise.all([listReviews(status), countReviewsByStatus()]);
  return { rows, counts };
}

async function ReviewList({ searchParams }: Pick<PageProps<"/admin/reviews">, "searchParams">) {
  if (!hasDatabase()) return <DbNotice />;
  const params = await searchParams;
  const status = isReviewStatus(params.status) ? params.status : undefined;
  const { rows, counts } = await load(status);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const tabs = [
    { status: undefined, label: "All", count: total },
    ...(Object.keys(reviewStatusLabel) as ReviewStatus[]).map((s) => ({
      status: s,
      label: reviewStatusLabel[s],
      count: counts[s],
    })),
  ];

  return (
    <div className="space-y-4">
      <nav aria-label="Filter by status">
        <ul className="flex flex-wrap gap-1">
          {tabs.map((t) => {
            const current = t.status === status;
            return (
              <li key={t.label}>
                <Link
                  href={t.status ? `/admin/reviews?status=${t.status}` : "/admin/reviews"}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-sm border border-line px-3 py-1.5 text-sm text-stone transition-colors hover:border-ink/40 hover:text-ink",
                    current && "border-ink bg-ink text-ivory hover:text-ivory",
                  )}
                >
                  {t.label}
                  <span className={cn("text-xs tabular-nums", current ? "text-ivory/70" : "text-stone/70")}>{t.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {rows.length === 0 ? (
        <p className="rounded-sm border border-line p-8 text-center text-sm text-stone">
          {status ? "No reviews with this status." : "No reviews yet. Add one with “Add review”."}
        </p>
      ) : (
        <div className="rounded-sm border border-line">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reviewer</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="relative">
                  <TableCell className="whitespace-nowrap">
                    <Link
                      href={`/admin/reviews/${r.id}`}
                      className="font-medium text-ink after:absolute after:inset-0 hover:underline"
                    >
                      {r.name}
                    </Link>
                    {r.isSample && <SampleBadge className="ml-2" />}
                    <div className="text-xs text-stone">
                      {(r.procedureSlug && getProcedure(r.procedureSlug)?.name) || "No procedure"}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-96 truncate" title={r.body}>
                    {r.body}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span role="img" aria-label={`${r.rating} out of 5 stars`}>
                      <span className="text-bronze">{"★".repeat(r.rating)}</span>
                      <span className="text-line">{"★".repeat(5 - r.rating)}</span>
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDateTime(r.updatedAt)}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
