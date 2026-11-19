import { cn } from "@/lib/utils";

const tones = {
  default: "bg-background text-foreground",
  alt: "bg-cream text-ink", // alternating warm band
  dark: "bg-ink text-ivory [&_.eyebrow]:text-sand", // sand is readable on ink (10:1)
} as const;

/** Full-width band with fluid vertical rhythm. Put a <Container> inside. */
export function Section({
  tone = "default",
  className,
  ...props
}: React.ComponentProps<"section"> & { tone?: keyof typeof tones }) {
  return <section className={cn("section-y", tones[tone], className)} {...props} />;
}
