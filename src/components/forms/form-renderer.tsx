"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useForm, type FieldPath, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ds";
import { readAttribution } from "@/components/site/attribution";
import { submitForm } from "@/app/(site)/forms/actions";
import { buildSubmissionSchema, emptyAnswers, type FormField, type FormFields } from "@/lib/cms/form-schema";
import { cn } from "@/lib/utils";

type Values = {
  answers: Record<string, unknown>;
  marketingConsent: boolean;
  privacyAccepted: boolean;
  company: string;
};

const inputClass =
  "h-12 w-full rounded-sm border border-input bg-white px-4 text-base text-ink transition-colors placeholder:text-stone/60 hover:border-stone/50 focus-visible:border-bronze aria-invalid:border-destructive";

const autoComplete: Record<string, string> = { name: "name", email: "email", phone: "tel" };

/**
 * A custom form from admin → Forms. Validates in the browser for instant feedback; the server
 * validates again against the published definition. Submissions become leads.
 */
export function FormRenderer({ slug, form }: { slug: string; form: FormFields }) {
  const [done, setDone] = useState<{ demo?: boolean } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const successRef = useRef<HTMLHeadingElement>(null);
  const uid = useId();

  const methods = useForm<Values>({
    // The schema is built from the form definition at runtime, so its types are loose.
    resolver: zodResolver(buildSubmissionSchema(form)) as unknown as Resolver<Values>,
    mode: "onTouched",
    defaultValues: { answers: emptyAnswers(form), marketingConsent: false, privacyAccepted: false, company: "" },
  });
  const { register, formState } = methods;
  const errors = formState.errors;
  const answerError = (id: string) => (errors.answers as Record<string, { message?: string }> | undefined)?.[id]?.message;

  useEffect(() => {
    if (done) successRef.current?.focus();
  }, [done]);

  const onSubmit = methods.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const res = await submitForm(slug, { ...values, ...readAttribution() });
      if (res.ok) {
        setDone(res);
        return;
      }
      setServerError(res.error);
      for (const [key, message] of Object.entries(res.fieldErrors ?? {})) {
        methods.setError(key as FieldPath<Values>, { message });
      }
    });
  });

  if (done) {
    return (
      <div className="stack" role="status">
        <span className="grid size-14 place-items-center rounded-full bg-cream text-bronze">
          <Check className="size-6" aria-hidden />
        </span>
        <h2 ref={successRef} tabIndex={-1} className="font-heading text-h3 font-light outline-none">
          Message sent.
        </h2>
        <p className="text-stone">{form.successMessage}</p>
        {done.demo && (
          <p className="border-l-2 border-bronze bg-cream px-4 py-3 text-sm text-stone">
            <strong className="font-medium text-ink">Demo mode:</strong> no database is connected, so this message was not
            stored.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby={serverError ? `${uid}-error` : undefined} className="stack">
      {serverError && (
        <p id={`${uid}-error`} role="alert" className="border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {serverError}
        </p>
      )}

      {/* Honeypot — hidden from people, tempting for bots */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Company
          <input type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
        </label>
      </div>

      {form.fields.map((f) => (
        <Field key={f.id} field={f} error={answerError(f.id)} register={register} />
      ))}

      <div className="stack gap-4! border-t border-line pt-6">
        {form.showMarketingConsent && (
          <ConsentBox {...register("marketingConsent")}>Send me occasional news and offers by email. Unsubscribe at any time.</ConsentBox>
        )}
        <ConsentBox required error={errors.privacyAccepted?.message} {...register("privacyAccepted")}>
          I have read the <TextLink href="/privacy">privacy policy</TextLink> and agree to be contacted about this message.
        </ConsentBox>
      </div>

      <p className="flex items-start gap-2 text-xs text-stone">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Your information is sent securely and used only to reply to you. Please don’t include medical details.
      </p>

      <div data-slot="actions">
        <Button type="submit" size="cta-lg" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" /> Sending…
            </>
          ) : (
            <>
              {form.submitLabel} <ArrowRight />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ── Fields ────────────────────────────────────────────────────────────────

type Register = ReturnType<typeof useForm<Values>>["register"];

function Field({ field: f, error, register }: { field: FormField; error?: string; register: Register }) {
  const id = useId();
  const name = `answers.${f.id}` as FieldPath<Values>;
  const hintId = f.hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = cn(hintId, errorId) || undefined;
  const optionalTag = !f.required && <span className="text-sm font-normal text-stone">Optional</span>;

  if (f.type === "radio" || f.type === "checkboxes" || f.type === "yesNo") {
    const options =
      f.type === "yesNo" ? [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] : f.options.map((o) => ({ value: o.label, label: o.label }));
    return (
      <fieldset aria-describedby={describedBy} aria-invalid={!!error || undefined}>
        <legend className="mb-1 flex w-full justify-between gap-3 font-medium text-ink">
          {f.label}
          {optionalTag}
        </legend>
        {f.hint && (
          <p id={hintId} className="mb-1 text-sm text-stone">
            {f.hint}
          </p>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {options.map((o) => (
            <OptionCard key={o.value} type={f.type === "checkboxes" ? "checkbox" : "radio"} value={o.value} label={o.label} {...register(name)} />
          ))}
        </div>
        <FieldError id={errorId} message={error} />
      </fieldset>
    );
  }

  const common = { id, "aria-invalid": !!error, "aria-describedby": describedBy, "aria-required": f.required || undefined };
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex justify-between gap-3 font-medium text-ink">
        {f.label}
        {optionalTag}
      </label>
      {f.hint && (
        <p id={hintId} className="mb-3 text-sm text-stone">
          {f.hint}
        </p>
      )}
      {f.type === "longText" ? (
        <textarea rows={4} className={cn(inputClass, "h-auto py-3")} {...common} {...register(name)} />
      ) : f.type === "select" ? (
        <select className={inputClass} {...common} {...register(name)}>
          <option value="">Choose…</option>
          {f.options.map((o) => (
            <option key={o.label} value={o.label}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={f.type === "email" ? "email" : f.type === "phone" ? "tel" : f.type === "date" ? "date" : "text"}
          inputMode={f.type === "email" ? "email" : f.type === "phone" ? "tel" : undefined}
          autoComplete={f.mapsTo ? autoComplete[f.mapsTo] : undefined}
          className={inputClass}
          {...common}
          {...register(name)}
        />
      )}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-sm text-destructive">
      {message}
    </p>
  );
}

/** Selectable card backed by a real radio or checkbox input. */
function OptionCard({ label, type, ...props }: React.ComponentProps<"input"> & { label: string }) {
  return (
    <label className="relative cursor-pointer">
      <input type={type} className="peer sr-only" {...props} />
      <span className="flex h-full items-center justify-between gap-3 rounded-sm border border-input bg-white px-5 py-4 transition-colors peer-checked:border-bronze peer-checked:bg-cream peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bronze hover:border-stone/60 peer-checked:[&_.dot]:border-bronze peer-checked:[&_.dot]:bg-bronze">
        <span className="text-ink">{label}</span>
        <span
          aria-hidden
          className={cn(
            "dot size-4 shrink-0 border border-input bg-white shadow-[inset_0_0_0_3px_white] transition-colors",
            type === "checkbox" ? "rounded-[3px]" : "rounded-full",
          )}
        />
      </span>
    </label>
  );
}

function ConsentBox({ children, error, ...props }: React.ComponentProps<"input"> & { error?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm text-stone">
        <input
          id={id}
          type="checkbox"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-4.5 shrink-0 cursor-pointer accent-bronze"
          {...props}
        />
        <span>{children}</span>
      </label>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
