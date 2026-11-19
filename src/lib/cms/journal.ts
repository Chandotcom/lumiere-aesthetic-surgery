import "server-only";
import { posts as builtInPosts, type Post } from "@/lib/content/journal";
import { procedures } from "@/lib/content/procedures";
import { readContent } from "./read";
import { postSchema, type PostFields } from "./schemas";

const procedureSlugs = new Set(procedures.map((p) => p.slug));

export function postToFields(p: Post): PostFields {
  return {
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    publishedAt: p.publishedAt,
    readTime: p.readTime,
    image: { ...p.image },
    relatedProcedures: [...p.relatedProcedures],
    visible: true,
    content: p.content,
  };
}

/** Starting values for a brand-new post. */
export function newPostFields(title: string, today: string): PostFields {
  return {
    title,
    excerpt: "A short summary shown on cards and in search results.",
    category: "Guides",
    publishedAt: today,
    readTime: "4 min read",
    image: {
      src: "https://images.unsplash.com/photo-1552693673-1bf958298935",
      alt: "Clinician performing a skin treatment on a relaxed patient",
    },
    relatedProcedures: [],
    visible: true,
    content: "Start with a direct, two-sentence answer to the question this article covers.\n\n## First section\n\nWrite in plain language. Use **bold** for key points and lists where they help:\n\n- One idea per bullet\n- Keep bullets short",
  };
}

function fieldsToPost(slug: string, f: PostFields): Post {
  return {
    slug,
    title: f.title,
    excerpt: f.excerpt,
    category: f.category,
    publishedAt: f.publishedAt,
    readTime: f.readTime,
    image: f.image,
    // Ignore procedures that no longer exist so links never break.
    relatedProcedures: f.relatedProcedures.filter((s) => procedureSlugs.has(s)),
    content: f.content,
  };
}

export const isBuiltInPost = (slug: string) => builtInPosts.some((p) => p.slug === slug);

/**
 * Public posts, newest first: built-in articles with published edits applied, plus posts
 * created in the admin. Hidden posts are left out. In preview (Draft Mode) drafts are used,
 * including draft-only new posts.
 */
export async function getPosts(): Promise<Post[]> {
  const docs = await readContent("post");
  const out = new Map<string, Post>(builtInPosts.map((p) => [p.slug, p]));
  const hidden = new Set<string>();

  for (const [slug, raw] of Object.entries(docs)) {
    const parsed = postSchema.safeParse(raw);
    if (!parsed.success) continue;
    if (!parsed.data.visible) hidden.add(slug);
    out.set(slug, fieldsToPost(slug, parsed.data));
  }
  return [...out.values()]
    .filter((p) => !hidden.has(p.slug))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));
}

export async function getPostBySlug(slug: string) {
  return (await getPosts()).find((p) => p.slug === slug);
}
