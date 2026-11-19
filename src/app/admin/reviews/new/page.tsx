import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReviewForm } from "@/components/admin/reviews/review-form";
import { emptyReview } from "@/lib/reviews/meta";

export const metadata: Metadata = { title: "Add review" };

export default function NewReviewPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/reviews" className="inline-flex items-center gap-1.5 text-sm text-stone hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Reviews
      </Link>
      <div>
        <h1 className="font-heading text-3xl">Add review</h1>
        <p className="mt-1 text-sm text-stone">
          Add a review a patient gave you, with their permission to publish it. It stays private until you publish it.
        </p>
      </div>
      <ReviewForm defaults={emptyReview} />
    </div>
  );
}
