"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Container, Eyebrow, Heading } from "@/components/ds";
import { site } from "@/lib/site";

/** Friendly in-layout error page (header/footer stay visible). Next 16 passes `retry`. */
export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    // Hook up an error-reporting service here. Never include form contents (may hold health info).
    console.error(error);
  }, [error]);

  return (
    <section className="bg-ivory">
      <Container size="prose" className="stack items-start py-(--section-y)">
        <Eyebrow>Something went wrong</Eyebrow>
        <Heading level={1} size="h2">
          We couldn’t load <em>this page.</em>
        </Heading>
        <p className="lead">
          It’s not you — something on our side didn’t work as expected. Please try again, or call
          us on {site.phone} if you need help right away.
        </p>
        <div data-slot="actions" className="flex flex-col gap-3 sm:flex-row">
          <Button size="cta-lg" onClick={() => retry()}>
            <RotateCcw /> Try again
          </Button>
          <ButtonLink size="cta-lg" variant="outline" href="/">
            Back to home
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
