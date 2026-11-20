import type { Metadata } from "next";
import { notFoundMetadata } from "@/lib/seo/not-found";
import { NotFoundContent } from "@/components/site/not-found-content";

// notFound() inside the site (unknown pages, procedures, cases, posts) renders within the site
// layout, which already provides the header, footer and cookie banner.
export const metadata: Metadata = notFoundMetadata;

export default function SiteNotFound() {
  return <NotFoundContent />;
}
