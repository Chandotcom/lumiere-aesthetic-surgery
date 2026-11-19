import { Accent } from "@/components/ds/accent";
import { getHomeContent } from "@/lib/cms/home";
import { getPublishedReviews } from "@/lib/reviews/read";
import { TestimonialsCarousel } from "./testimonials-carousel";

/**
 * Published patient reviews (managed in Admin → Reviews). The heading comes from the homepage
 * editor unless a page-builder section passes its own. Renders nothing when none are published.
 */
export async function Testimonials({ heading }: { heading?: string } = {}) {
  const [{ testimonials }, reviews] = await Promise.all([getHomeContent(), getPublishedReviews()]);
  if (reviews.length === 0) return null;
  return <TestimonialsCarousel reviews={reviews} heading={<Accent text={heading ?? testimonials.heading} />} />;
}
