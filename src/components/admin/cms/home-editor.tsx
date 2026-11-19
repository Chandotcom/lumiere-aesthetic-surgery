"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { homeSchema, type HomeContent } from "@/lib/cms/schemas";
import { ContentForm, type ContentState } from "./content-form";
import { EditorSection as Section } from "./editor-page";
import { ImageField, ListField, TextField } from "./fields";

type F = HomeContent;

const ACCENT_HINT = "Wrap the accent words in *asterisks* to show them in bronze, e.g. Natural results, *refined* by expertise.";

export function HomeEditor({ initial, state }: { initial: F; state: ContentState }) {
  const form = useForm<F>({ resolver: zodResolver(homeSchema), defaultValues: initial, mode: "onBlur" });

  return (
    <ContentForm form={form} kind="home" contentKey="main" state={state}>
      <Section title="Hero" description="The first screen visitors see.">
        <TextField<F> name="hero.eyebrow" label="Small label above the heading" maxLength={100} />
        <TextField<F> name="hero.heading" label="Heading" maxLength={120} hint={ACCENT_HINT} />
        <TextField<F> name="hero.intro" label="Intro" multiline maxLength={300} />
        <ImageField<F> name="hero.image" label="Portrait" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField<F> name="hero.badgeTitle" label="Badge title" maxLength={40} />
          <TextField<F> name="hero.badgeText" label="Badge text" maxLength={60} />
        </div>
        <TextField<F> name="hero.trustLine" label="Trust line (next to the stars)" maxLength={140} />
      </Section>

      <Section title="Philosophy statement">
        <TextField<F> name="statement.text" label="Statement" multiline rows={4} maxLength={400} hint={ACCENT_HINT} />
        <TextField<F> name="statement.body" label="Supporting paragraph" multiline rows={4} maxLength={500} />
        <ImageField<F> name="statement.image" label="Image" />
      </Section>

      <Section title="Meet your surgeon" description="The photo and stats also appear on the About page.">
        <TextField<F> name="surgeon.heading" label="Heading" maxLength={120} hint={ACCENT_HINT} />
        <TextField<F> name="surgeon.quote" label="Quote" multiline maxLength={200} hint="Shown in quotation marks; don't add your own." />
        <TextField<F> name="surgeon.intro" label="Intro" multiline maxLength={400} />
        <ImageField<F> name="surgeon.image" label="Surgeon photo" />
        <ListField<F, "surgeon.credentials">
          name="surgeon.credentials"
          label="Credentials"
          itemLabel="Credential"
          newItem={{ value: "" }}
          max={6}
          renderItem={(i) => <TextField<F> name={`surgeon.credentials.${i}.value`} label="Text" maxLength={120} />}
        />
        <ListField<F, "surgeon.stats">
          name="surgeon.stats"
          label="Stats"
          itemLabel="Stat"
          newItem={{ value: "", suffix: "", label: "" }}
          max={4}
          renderItem={(i) => (
            <div className="grid gap-3 sm:grid-cols-[6rem_5rem_1fr]">
              <TextField<F> name={`surgeon.stats.${i}.value`} label="Number" maxLength={10} />
              <TextField<F> name={`surgeon.stats.${i}.suffix`} label="Suffix" maxLength={4} />
              <TextField<F> name={`surgeon.stats.${i}.label`} label="Label" maxLength={60} />
            </div>
          )}
        />
      </Section>

      <Section title="Patient journey">
        <TextField<F> name="journey.heading" label="Heading" maxLength={120} hint={ACCENT_HINT} />
        <TextField<F> name="journey.intro" label="Intro" multiline maxLength={300} />
        <ImageField<F> name="journey.image" label="Image" />
        <ListField<F, "journey.steps">
          name="journey.steps"
          label="Steps"
          itemLabel="Step"
          newItem={{ title: "", text: "" }}
          max={6}
          renderItem={(i) => (
            <>
              <TextField<F> name={`journey.steps.${i}.title`} label="Title" maxLength={60} />
              <TextField<F> name={`journey.steps.${i}.text`} label="Text" multiline maxLength={240} />
            </>
          )}
        />
      </Section>

      <Section
        title="Patient stories"
        description="Also shown on the About page."
      >
        <TextField<F> name="testimonials.heading" label="Heading" maxLength={120} hint={ACCENT_HINT} />
        <p className="text-sm text-stone">
          The reviews themselves are managed in{" "}
          <Link href="/admin/reviews" className="text-bronze hover:underline">
            Reviews
          </Link>
          .
        </p>
      </Section>

      <Section title="General FAQ" description="Shown on the homepage and the consultation page, and published as FAQ structured data.">
        <TextField<F> name="faq.heading" label="Heading" maxLength={120} hint={ACCENT_HINT} />
        <ListField<F, "faq.items">
          name="faq.items"
          label="Questions"
          itemLabel="Question"
          newItem={{ question: "", answer: "" }}
          max={12}
          renderItem={(i) => (
            <>
              <TextField<F> name={`faq.items.${i}.question`} label="Question" maxLength={200} />
              <TextField<F> name={`faq.items.${i}.answer`} label="Answer" multiline rows={4} maxLength={1500} />
            </>
          )}
        />
      </Section>

      <Section title="Closing call to action" description="The dark banner at the bottom of most pages.">
        <TextField<F> name="finalCta.heading" label="Heading" maxLength={120} hint={ACCENT_HINT} />
        <TextField<F> name="finalCta.intro" label="Intro" multiline maxLength={300} />
        <ImageField<F> name="finalCta.image" label="Background image" />
      </Section>
    </ContentForm>
  );
}
