import { Accent } from "@/components/ds/accent";
import { getHomeContent } from "@/lib/cms/home";
import { getPublishedReviews } from "@/lib/reviews/read";
import { TestimonialsCarousel } from "./testimonials-carousel";

/**
 * Published patient reviews (managed in Admin → Reviews), under the heading from the homepage
 * editor. Renders nothing when no reviews are published.
 */
export async function Testimonials() {
  const [{ testimonials }, reviews] = await Promise.all([getHomeContent(), getPublishedReviews()]);
  if (reviews.length === 0) return null;
  return <TestimonialsCarousel reviews={reviews} heading={<Accent text={testimonials.heading} />} />;
}
