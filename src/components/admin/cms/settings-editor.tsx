"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  seoPages,
  seoSchema,
  settingsSchema,
  type SeoContent,
  type SeoPage,
  type SiteSettings,
} from "@/lib/cms/schemas";
import { ContentForm, type ContentState } from "./content-form";
import { EditorSection as Section } from "./editor-page";
import { ListField, TextField } from "./fields";

export function SettingsEditor({ initial, state }: { initial: SiteSettings; state: ContentState }) {
  type F = SiteSettings;
  const form = useForm<F>({ resolver: zodResolver(settingsSchema), defaultValues: initial, mode: "onBlur" });
  return (
    <ContentForm form={form} kind="settings" contentKey="main" state={state}>
      <Section title="Phone & email" description="Used in the header, footer, contact page, legal pages and structured data.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField<F> name="phone" label="Phone" maxLength={30} />
          <TextField<F> name="email" label="Email" maxLength={120} />
        </div>
      </Section>
      <Section
        title="New enquiry alerts"
        description="Every Admin and Front desk account gets an email for each new consultation request. Add a shared inbox here to alert it too."
      >
        <TextField<F>
          name="notificationEmail"
          label="Clinic inbox (optional)"
          maxLength={120}
          placeholder="enquiries@yourclinic.com"
          hint="The email only says who it’s from and links to the lead. Patient details stay in the dashboard."
        />
      </Section>
      <Section title="Address">
        <TextField<F> name="address.street" label="Street" maxLength={120} />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField<F> name="address.city" label="City" maxLength={60} />
          <TextField<F> name="address.region" label="State / region" maxLength={40} />
          <TextField<F> name="address.postal" label="Postal code" maxLength={20} />
        </div>
      </Section>
      <Section
        title="Opening hours"
        description="Shown on the contact page. Once edited, the machine-readable hours are left out of the structured data, because free text can't be read reliably."
      >
        <ListField<F, "hours">
          name="hours"
          label="Rows"
          itemLabel="Row"
          newItem={{ days: "", time: "" }}
          max={7}
          renderItem={(i) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField<F> name={`hours.${i}.days`} label="Days" maxLength={40} />
              <TextField<F> name={`hours.${i}.time`} label="Hours" maxLength={40} />
            </div>
          )}
        />
      </Section>
    </ContentForm>
  );
}

export function SeoEditor({ initial, state }: { initial: SeoContent; state: ContentState }) {
  type F = SeoContent;
  const form = useForm<F>({ resolver: zodResolver(seoSchema), defaultValues: initial, mode: "onBlur" });
  return (
    <ContentForm form={form} kind="seo" contentKey="main" state={state}>
      {(Object.keys(seoPages) as SeoPage[]).map((page) => (
        <Section key={page} title={seoPages[page].label} description={seoPages[page].path}>
          <TextField<F>
            name={`${page}.title`}
            label="Title"
            maxLength={70}
            hint={
              page === "home"
                ? "Shown exactly as written. Aim for 50–60 characters."
                : "“| Lumière Aesthetic Surgery” is added automatically. Aim for 30–50 characters."
            }
          />
          <TextField<F>
            name={`${page}.description`}
            label="Description"
            multiline
            maxLength={220}
            hint="The snippet under the title in search results. Aim for 120–160 characters."
          />
        </Section>
      ))}
    </ContentForm>
  );
}
