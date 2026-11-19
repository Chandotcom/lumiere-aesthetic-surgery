import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/not-found-content";

// notFound() inside the site (unknown pages, procedures, cases, posts) renders within the site
// layout, which already provides the header, footer and cookie banner.
export const metadata: Metadata = { title: "Page not found" };

export default function SiteNotFound() {
  return <NotFoundContent />;
}
