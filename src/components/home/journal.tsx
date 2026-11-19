import { Container, Eyebrow, Heading, TextLink } from "@/components/ds";
import { PostCard } from "@/components/journal/post-card";
import { Reveal } from "@/components/motion/reveal";
import { getPosts } from "@/lib/cms/journal";

/** Homepage teaser: the three most recent journal articles. */
export async function Journal() {
  const posts = await getPosts();
  return (
    <section aria-labelledby="journal-heading" className="section-y border-t border-line bg-ivory">
      <Container size="wide">
        <Reveal className="section-intro flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="stack">
            <Eyebrow>The journal</Eyebrow>
            <Heading level={2} id="journal-heading">
              Insight, <em>before you decide.</em>
            </Heading>
          </div>
          <TextLink href="/blog" className="self-start md:self-auto">
            View all articles
          </TextLink>
        </Reveal>

        <ul className="grid gap-12 md:grid-cols-3 md:gap-8">
          {posts.slice(0, 3).map((p, i) => (
            <Reveal as="li" key={p.slug} delay={i * 120}>
              <PostCard post={p} />
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
