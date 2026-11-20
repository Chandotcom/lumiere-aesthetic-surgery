"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { consultationTextsSchema, type ConsultationTexts } from "@/lib/cms/consultation-schema";
import { consultTypes, contactMethods, timeframes } from "@/lib/validation/consultation";
import { ContentForm, type ContentState } from "./content-form";
import { EditorSection as Section } from "./editor-page";
import { TextField } from "./fields";

type F = ConsultationTexts;

/** Wording of the 3-step consultation form. The questions themselves and the stored answers stay fixed. */
export function ConsultationEditor({ initial, state }: { initial: F; state: ContentState }) {
  const form = useForm<F>({ resolver: zodResolver(consultationTextsSchema), defaultValues: initial, mode: "onBlur" });
  return (
    <ContentForm form={form} kind="consultation" contentKey="main" state={state} revertLabel="Revert to the built-in wording" unpublishedText="Live form uses the built-in wording">
      <Section title="Steps" description="The three step names in the progress bar.">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField<F> name="steps.interests" label="Step 1" maxLength={40} />
          <TextField<F> name="steps.details" label="Step 2" maxLength={40} />
          <TextField<F> name="steps.confirm" label="Step 3" maxLength={40} />
        </div>
      </Section>

      <Section title="Step 1: interests" description="The areas and procedures come from the procedure pages, so they aren't edited here.">
        <TextField<F> name="interests.areasQuestion" label="Areas question" maxLength={120} />
        <TextField<F> name="interests.areasHint" label="Areas help text (optional)" maxLength={200} />
        <TextField<F> name="interests.notSureLabel" label="“Not sure yet” option" maxLength={80} />
        <TextField<F> name="interests.specificQuestion" label="Specific procedures question" maxLength={120} />
        <TextField<F> name="interests.consultTypeQuestion" label="Consultation type question" maxLength={120} />
        {consultTypes.map((o) => (
          <div key={o.value} className="grid gap-3 sm:grid-cols-2">
            <TextField<F> name={`consultTypes.${o.value}.label`} label={`Option: ${o.label}`} maxLength={60} />
            <TextField<F> name={`consultTypes.${o.value}.hint`} label="Its hint (optional)" maxLength={80} />
          </div>
        ))}
        <TextField<F> name="interests.timeframeQuestion" label="Timeframe question" maxLength={120} />
        <div className="grid gap-3 sm:grid-cols-2">
          {timeframes.map((o) => (
            <TextField<F> key={o.value} name={`timeframes.${o.value}.label`} label={`Option: ${o.label}`} maxLength={60} />
          ))}
        </div>
      </Section>

      <Section title="Step 2: details">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField<F> name="details.firstName" label="First name label" maxLength={40} />
          <TextField<F> name="details.lastName" label="Last name label" maxLength={40} />
          <TextField<F> name="details.email" label="Email label" maxLength={40} />
          <TextField<F> name="details.phone" label="Phone label" maxLength={40} />
        </div>
        <TextField<F> name="details.contactMethodQuestion" label="Contact method question" maxLength={120} />
        <div className="grid gap-3 sm:grid-cols-3">
          {contactMethods.map((o) => (
            <TextField<F> key={o.value} name={`contactMethods.${o.value}.label`} label={`Option: ${o.label}`} maxLength={60} />
          ))}
        </div>
      </Section>

      <Section title="Step 3: confirm" description="Consent wording should be reviewed by the clinic before changing it on a real site.">
        <TextField<F> name="confirm.messageLabel" label="Message label" maxLength={120} />
        <TextField<F> name="confirm.messageHint" label="Message help text (optional)" multiline rows={2} maxLength={300} />
        <TextField<F> name="confirm.smsConsent" label="SMS consent checkbox" multiline rows={2} maxLength={300} />
        <TextField<F> name="confirm.marketingConsent" label="Marketing consent checkbox" multiline rows={2} maxLength={300} />
        <TextField<F>
          name="confirm.privacyConsent"
          label="Privacy consent checkbox (required)"
          multiline
          rows={2}
          maxLength={300}
          hint="Put the words that link to the privacy policy in [square brackets], once."
        />
        <TextField<F> name="confirm.securityNote" label="Security note (optional)" multiline rows={2} maxLength={300} />
        <TextField<F> name="confirm.submitLabel" label="Button text" maxLength={40} hint="The site uses “Request a consultation” everywhere else." />
      </Section>

      <Section title="After sending">
        <TextField<F> name="success.heading" label="Heading" maxLength={80} hint="{name} is replaced with the visitor’s first name." />
        <TextField<F> name="success.text" label="Text" multiline rows={3} maxLength={400} />
      </Section>
    </ContentForm>
  );
}
