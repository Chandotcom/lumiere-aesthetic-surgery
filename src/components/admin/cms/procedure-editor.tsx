"use client";

import { useForm, useFormContext, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { procedureFieldsSchema, type ProcedureFields } from "@/lib/cms/schemas";
import { defaultProcedureTitle } from "@/lib/content/procedures";
import { site } from "@/lib/site";
import { ContentForm, type ContentState } from "./content-form";
import { EditorSection as Section } from "./editor-page";
import { ImageField, ListField, NumberField, TextField } from "./fields";

type F = ProcedureFields;

export function ProcedureEditor({
  slug,
  name,
  initial,
  state,
}: {
  slug: string;
  name: string;
  initial: F;
  state: ContentState;
}) {
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

      <Section
        title="Search engines (SEO)"
        description="Optional. Leave a field empty to use the automatic version shown in grey."
      >
        <TextField<F>
          name="seo.title"
          label="Page title"
          maxLength={70}
          placeholder={defaultProcedureTitle(name)}
          hint="“| Lumière Aesthetic Surgery” is added automatically. Aim for 30–60 characters."
        />
        <TextField<F>
          name="seo.description"
          label="Meta description"
          multiline
          maxLength={220}
          placeholder="Uses the summary above."
          hint="The snippet under the title in search results. Aim for 120–160 characters."
        />
        <SearchPreview slug={slug} name={name} />
      </Section>
    </ContentForm>
  );
}

/** Approximate Google result, so staff can see what searchers will see. */
function SearchPreview({ slug, name }: { slug: string; name: string }) {
  const { control } = useFormContext<F>();
  const [title, description, summary] = useWatch({ control, name: ["seo.title", "seo.description", "summary"] });
  const fullTitle = `${title?.trim() || defaultProcedureTitle(name)} | ${site.name}`;
  const text = description?.trim() || summary?.trim() || "";
  const shown = text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text;
  return (
    <figure className="space-y-1 rounded-sm border border-line bg-white p-4">
      <figcaption className="mb-2 text-xs text-stone">Search result preview (approximate)</figcaption>
      <p className="truncate text-xs text-stone">
        {site.url.replace(/^https?:\/\//, "")} › procedures › {slug}
      </p>
      <p className="truncate text-lg leading-snug text-[#1a0dab]">{fullTitle}</p>
      <p className="text-sm text-stone">{shown}</p>
      <p className="pt-1 text-xs text-stone tabular-nums">
        Title {fullTitle.length} characters · description {text.length} characters
        {text.length > 160 && " (search engines usually cut it around 160)"}
      </p>
    </figure>
  );
}
