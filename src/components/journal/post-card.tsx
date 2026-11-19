import Image from "next/image";
import Link from "next/link";
import { Heading } from "@/components/ds";
import { formatDate, type Post } from "@/lib/content/journal";
import { cn } from "@/lib/utils";

export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      prefetch
      className={cn("group grid gap-6", featured && "md:grid-cols-12 md:items-center md:gap-12")}
    >
      <div className={cn("relative overflow-hidden bg-cream", featured ? "aspect-[4/3] md:col-span-7" : "aspect-[4/3]")}>
        <Image
          src={post.image.src}
          alt={post.image.alt}
          fill
          sizes={featured ? "(min-width: 840px) 55vw, 100vw" : "(min-width: 840px) 33vw, 100vw"}
          className="object-cover transition-transform duration-1000 ease-luxe group-hover:scale-105"
        />
      </div>
      <div className={cn("flex flex-col gap-3", featured && "md:col-span-5")}>
        <p className="flex flex-wrap gap-3 text-xs tracking-wide text-stone uppercase">
          <span className="text-bronze">{post.category}</span>
          <span aria-hidden>·</span>
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span aria-hidden>·</span>
          <span>{post.readTime}</span>
        </p>
        <Heading
          level={featured ? 2 : 3}
          size={featured ? "h2" : "h4"}
          className="transition-colors group-hover:text-bronze"
        >
          {post.title}
        </Heading>
        <p className={cn("text-stone", featured ? "lead" : "text-sm")}>{post.excerpt}</p>
        {featured && <span className="link-underline mt-2 self-start text-sm">Read the article</span>}
      </div>
    </Link>
  );
}
