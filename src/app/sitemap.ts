import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/cms/journal";
import { getPages } from "@/lib/cms/pages";
import { getGalleryCases } from "@/lib/gallery/read";
import { procedures } from "@/lib/content/procedures";
import { site } from "@/lib/site";

const staticPaths = ["/", "/about", "/procedures", "/consultation", "/gallery", "/blog", "/contact", "/privacy", "/terms", "/accessibility"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, cases, pages] = await Promise.all([getPosts(), getGalleryCases(), getPages()]);
  return [
    ...staticPaths.map((path) => ({
      url: new URL(path, site.url).toString(),
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : path === "/procedures" || path === "/consultation" ? 0.9 : 0.6,
    })),
    ...[...pages]
      .filter(([, p]) => !p.noindex)
      .map(([slug]) => ({ url: new URL(`/${slug}`, site.url).toString(), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...procedures.map((p) => ({
      url: new URL(`/procedures/${p.slug}`, site.url).toString(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...posts.map((p) => ({
      url: new URL(`/blog/${p.slug}`, site.url).toString(),
      lastModified: p.publishedAt,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...cases.map((c) => ({
      url: new URL(`/gallery/${c.slug}`, site.url).toString(),
      lastModified: c.publishedAt,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];
}
