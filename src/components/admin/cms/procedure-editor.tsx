"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { procedureFieldsSchema, type ProcedureFields } from "@/lib/cms/schemas";
import { ContentForm, type ContentState } from "./content-form";
import { EditorSection as Section } from "./editor-page";
import { ImageField, ListField, NumberField, TextField } from "./fields";

type F = ProcedureFields;

export function ProcedureEditor({ slug, initial, state }: { slug: string; initial: F; state: ContentState }) {
  const form = useForm<F>({
    resolver: zodResolver(procedureFieldsSchema),
    defaultValues: initial,
    mode: "onBlur",
  });

  return (
    <ContentForm form={form} kind="procedure" contentKey={slug} state={state}>
      <Section title="Introduction" description="Shown at the top of the page and on procedure cards.">
        <TextField<F> name="tagline" label="Card tagline" maxLength={160} hint="One line on procedure cards." />
        <TextField<F>
          name="summary"
          label="Summary"
          multiline
          rows={4}
          maxLength={600}
          hint="The direct answer to “What is this procedure?”. Search and AI answer engines quote it, so 2–3 plain sentences."
        />
        <ImageField<F> name="image" label="Main photo" />
      </Section>

      <Section title="Key facts">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField<F> name="facts.duration" label="Procedure time" maxLength={60} />
          <TextField<F> name="facts.anesthesia" label="Anesthesia" maxLength={60} />
          <TextField<F> name="facts.recovery" label="Recovery" maxLength={60} />
          <TextField<F> name="facts.results" label="Results last" maxLength={60} />
        </div>
      </Section>

      <Section title="Pricing" description="Typical range in US dollars. The monthly financing estimate is calculated from the starting price.">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField<F> name="price.from" label="From ($)" step={50} />
          <NumberField<F> name="price.to" label="To ($)" step={50} />
        </div>
      </Section>

      <Section title="Ideal candidates" description="“This procedure may suit you if…”">
        <ListField<F, "idealFor">
          name="idealFor"
          label="Items"
          itemLabel="Item"
          newItem={{ value: "" }}
          max={10}
          renderItem={(i) => <TextField<F> name={`idealFor.${i}.value`} label="Text" maxLength={200} />}
        />
      </Section>

      <Section title="Recovery timeline" description="Shown as numbered steps.">
        <ListField<F, "timeline">
          name="timeline"
          label="Steps"
          itemLabel="Step"
          newItem={{ when: "", what: "" }}
          max={8}
          renderItem={(i) => (
            <>
              <TextField<F> name={`timeline.${i}.when`} label="When" maxLength={60} hint="e.g. “Week 1”" />
              <TextField<F> name={`timeline.${i}.what`} label="What happens" multiline maxLength={400} />
            </>
          )}
        />
      </Section>

      <Section title="FAQs" description="Also published as FAQ structured data for search engines.">
        <ListField<F, "faqs">
          name="faqs"
          label="Questions"
          itemLabel="Question"
          newItem={{ question: "", answer: "" }}
          max={12}
          renderItem={(i) => (
            <>
              <TextField<F> name={`faqs.${i}.question`} label="Question" maxLength={200} />
              <TextField<F> name={`faqs.${i}.answer`} label="Answer" multiline rows={4} maxLength={1500} />
            </>
          )}
        />
      </Section>
    </ContentForm>
  );
}
