import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CaseDetailsForm } from "@/components/admin/gallery/case-details-form";

export const metadata: Metadata = { title: "New gallery case" };

export default function NewCasePage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/gallery" className="inline-flex items-center gap-1.5 text-sm text-stone hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Gallery
      </Link>
      <div>
        <h1 className="font-heading text-3xl">New case</h1>
        <p className="mt-1 text-sm text-stone">
          Start with the case details. You’ll add the photos and consent on the next screen. New cases stay private
          until you publish them.
        </p>
      </div>
      <CaseDetailsForm
        defaults={{ procedureSlug: "", ageRange: "35–44", timeAfter: "", notes: "", views: ["Front"] }}
      />
    </div>
  );
}
