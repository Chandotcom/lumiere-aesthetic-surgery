import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { DbNotice, hasDatabase } from "@/components/admin/db-notice";
import { SampleBadge } from "@/components/admin/lead-status-badge";
import { ReviewForm } from "@/components/admin/reviews/review-form";
import { ReviewStatusPanel } from "@/components/admin/reviews/review-status-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/admin/format";
import { getReview, isLocked } from "@/lib/admin/reviews";
import type { ReviewFields, ReviewSource } from "@/lib/reviews/meta";

export const metadata: Metadata = { title: "Review" };

export default function ReviewPage({ params }: PageProps<"/admin/reviews/[id]">) {
  return (
    <div className="space-y-6">
      <Link href="/admin/reviews" className="inline-flex items-center gap-1.5 text-sm text-stone hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Reviews
      </Link>
      <Suspense fallback={<Skeleton className="h-[32rem] w-full" />}>
        <ReviewEditor params={params} />
      </Suspense>
    </div>
  );
}

async function load(id: number) {
  await connection();
  return getReview(id);
}

async function ReviewEditor({ params }: Pick<PageProps<"/admin/reviews/[id]">, "params">) {
  if (!hasDatabase()) return <DbNotice />;
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const review = await load(id);
  if (!review) notFound();

  const locked = isLocked(review);
  const defaults: ReviewFields = {
    name: review.name,
    rating: review.rating,
    body: review.body,
    procedureSlug: review.procedureSlug ?? "",
    source: review.source as ReviewSource,
    verified: review.verified,
    photo: { src: review.photoUrl ?? "", alt: review.photoAlt ?? "" },
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_20rem]">
      <div className="min-w-0 max-w-3xl space-y-6">
        <header>
          <p className="text-xs tracking-wide text-stone uppercase">
            Review{review.publishedAt ? ` · first published ${formatDateTime(review.publishedAt)}` : ""}
          </p>
          <h1 className="font-heading text-3xl">
            {review.name} {review.isSample && <SampleBadge className="ml-1 align-middle" />}
          </h1>
        </header>
        <ReviewForm key={review.updatedAt.toISOString()} reviewId={review.id} defaults={defaults} locked={locked} />
      </div>
      <aside className="space-y-3 xl:sticky xl:top-6 xl:h-fit">
        <h2 className="font-heading text-lg">Publishing</h2>
        <div className="rounded-sm border border-line p-4">
          <ReviewStatusPanel
            reviewId={review.id}
            status={review.status}
            hiddenReason={review.hiddenReason}
            canDelete={!locked}
          />
        </div>
      </aside>
    </div>
  );
}
