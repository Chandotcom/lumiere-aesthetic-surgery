import { Accent } from "@/components/ds/accent";
import { getHomeContent } from "@/lib/cms/home";
import { TestimonialsCarousel } from "./testimonials-carousel";

/** Patient stories from the homepage content (editable in the admin). Always labelled as samples. */
export async function Testimonials() {
  const { testimonials } = await getHomeContent();
  return <TestimonialsCarousel testimonials={testimonials.items} heading={<Accent text={testimonials.heading} />} />;
}
