import type { Metadata } from "next";

/**
 * Metadata for a missing page. Only the root not-found.tsx can set its own title, so routes that
 * call notFound() return this from generateMetadata, or the 404 would show the site's default title.
 */
export const notFoundMetadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };
