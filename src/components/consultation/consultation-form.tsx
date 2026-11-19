"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ArrowLeft, ArrowRight, Check, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ds";
import { readAttribution } from "@/components/site/attribution";
import { submitConsultation, type ConsultationResult } from "@/app/(site)/consultation/actions";
import { serviceGroups } from "@/lib/content/home";
import {
  consultationSchema,
  consultTypes,
  contactMethods,
  stepFields,
  timeframes,
} from "@/lib/validation/consultation";
import { cn } from "@/lib/utils";

type FormIn = z.input<typeof consultationSchema>;
type FormOut = z.output<typeof consultationSchema>;

const steps = ["Your interests", "Your details", "Confirm"] as const;

const inputClass =
  "h-12 w-full rounded-sm border border-input bg-white px-4 text-base text-ink transition-colors placeholder:text-stone/60 hover:border-stone/50 focus-visible:border-bronze aria-invalid:border-destructive";

export function ConsultationForm({ phone }: { phone: string }) {
  const searchParams = useSearchParams();
  // ?procedure=rhinoplasty → pre-select its area (Face) and the procedure itself
  const slug = searchParams.get("procedure");
  const preGroup = serviceGroups.find((g) => g.procedures.some((p) => p.href.endsWith(`/${slug}`)));
  const preProcedure = preGroup?.procedures.find((p) => p.href.endsWith(`/${slug}`))?.name;

  const [step, setStep] = useState(0);
  const [result, setResult] = useState<Extract<ConsultationResult, { ok: true }> | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const form = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(consultationSchema),
    mode: "onTouched",
    defaultValues: {
      areas: preGroup ? [preGroup.category] : [],
      procedures: preProcedure ? [preProcedure] : [],
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      contactMethod: "email",
      message: "",
      smsConsent: false,
      marketingConsent: false,
      company: "",
    },
  });
  const { register, formState, control } = form;
  const errors = formState.errors;
  // useWatch (not watch()) so React Compiler can memoize this component safely.
  const [contactMethod, smsConsent, areas] = useWatch({
    control,
    name: ["contactMethod", "smsConsent", "areas"],
  });
  const chosenGroups = serviceGroups.filter((g) => areas?.includes(g.category));
  const phoneRequired = contactMethod !== "email" || !!smsConsent;

  // Move focus to the step heading on step change (keyboard + screen-reader users).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    headingRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [step, result]);

  const next = async () => {
    const ok = await form.trigger(stepFields[step] as unknown as FieldPath<FormIn>[], { shouldFocus: true });
    if (ok) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const res = await submitConsultation({ ...values, ...readAttribution() });
      if (res.ok) {
        setResult(res);
        return;
      }
      setServerError(res.error);
      if (res.fieldErrors) {
        const fields = Object.keys(res.fieldErrors);
        for (const f of fields) form.setError(f as FieldPath<FormIn>, { message: res.fieldErrors[f] });
        const badStep = stepFields.findIndex((s) => (s as readonly string[]).some((f) => fields.includes(f)));
        if (badStep >= 0) setStep(badStep);
      }
    });
  });

  if (result) return <Success ref={headingRef} firstName={result.firstName} demo={result.demo} phone={phone} />;

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby={serverError ? "form-error" : undefined}>
      {/* Progress */}
      <ol className="mb-10 grid grid-cols-3 gap-3" aria-label="Form progress">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-col gap-2" aria-current={i === step ? "step" : undefined}>
            <span className={cn("h-0.5 w-full transition-colors duration-500", i <= step ? "bg-bronze" : "bg-line")} />
            <span className={cn("text-xs tracking-wide uppercase", i === step ? "text-ink" : "text-stone/70")}>
              <span className="numeral mr-1.5">0{i + 1}</span>
              <span className="max-sm:sr-only">{label}</span>
            </span>
          </li>
        ))}
      </ol>

      <h2 ref={headingRef} tabIndex={-1} className="font-heading text-h3 outline-none">
        {steps[step]}
        <span className="sr-only">
          {" "}
          — step {step + 1} of {steps.length}
        </span>
      </h2>

      {serverError && (
        <p id="form-error" role="alert" className="mt-6 border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive">
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

      {/* STEP 1 */}
      <div hidden={step !== 0} className="mt-8 stack">
        {/* Broad areas first — specifics are revealed only for the areas chosen */}
        <fieldset aria-describedby={errors.areas ? "areas-error" : "areas-hint"}>
          <legend className="mb-1 font-medium text-ink">Which area are you interested in?</legend>
          <p id="areas-hint" className="mb-5 text-sm text-stone">
            Choose one or more. Your surgeon will help with the details.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {serviceGroups.map((g) => (
              <AreaCard
                key={g.category}
                value={g.category}
                title={g.category}
                text={g.blurb}
                {...register("areas", { onChange: () => form.clearErrors("areas") })}
              />
            ))}
          </div>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-3 text-sm text-stone">
            <input
              type="checkbox"
              value="Not sure yet"
              className="size-4.5 cursor-pointer accent-bronze"
              {...register("areas", { onChange: () => form.clearErrors("areas") })}
            />
            I’m not sure yet — I’d like advice
          </label>
          <FieldError id="areas-error" message={errors.areas?.message} />
        </fieldset>

        {chosenGroups.length > 0 && (
          <fieldset className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-500 border-l-2 border-line pl-5">
            <legend className="mb-1 font-medium text-ink">
              Anything specific in mind? <span className="text-sm font-normal text-stone">Optional</span>
            </legend>
            <div className="mt-4 stack gap-5!">
              {chosenGroups.map((g) => (
                <div key={g.category}>
                  <p className="mb-2.5 text-xs tracking-wide text-stone uppercase">{g.category}</p>
                  <div className="flex flex-wrap gap-2">
                    {g.procedures.map((p) => (
                      <Chip key={p.name} value={p.name} {...register("procedures")} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset aria-describedby={errors.consultType ? "consultType-error" : undefined}>
          <legend className="mb-4 font-medium text-ink">How would you like to meet?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {consultTypes.map((o) => (
              <OptionCard key={o.value} type="radio" value={o.value} label={o.label} hint={o.hint} {...register("consultType", { onChange: () => form.clearErrors("consultType") })} />
            ))}
          </div>
          <FieldError id="consultType-error" message={errors.consultType?.message} />
        </fieldset>

        <fieldset aria-describedby={errors.timeframe ? "timeframe-error" : undefined}>
          <legend className="mb-4 font-medium text-ink">When are you hoping to have treatment?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {timeframes.map((o) => (
              <OptionCard key={o.value} type="radio" value={o.value} label={o.label} {...register("timeframe", { onChange: () => form.clearErrors("timeframe") })} />
            ))}
          </div>
          <FieldError id="timeframe-error" message={errors.timeframe?.message} />
        </fieldset>
      </div>

      {/* STEP 2 */}
      <div hidden={step !== 1} className="mt-8 stack">
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField label="First name" autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
          <TextField label="Last name" autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />
        </div>
        <TextField label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register("email")} />
        <TextField
          label="Phone"
          optional={!phoneRequired}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <fieldset>
          <legend className="mb-4 font-medium text-ink">Preferred way to reach you</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {contactMethods.map((o) => (
              <OptionCard key={o.value} type="radio" value={o.value} label={o.label} {...register("contactMethod", { onChange: () => form.clearErrors("phone") })} />
            ))}
          </div>
        </fieldset>
      </div>

      {/* STEP 3 */}
      <div hidden={step !== 2} className="mt-8 stack">
        <div>
          <label htmlFor="message" className="mb-2 flex justify-between font-medium text-ink">
            Anything you’d like us to know? <span className="text-sm font-normal text-stone">Optional</span>
          </label>
          <p id="message-hint" className="mb-3 text-sm text-stone">
            Please don’t include medical history here — we’ll discuss it privately at your consultation.
          </p>
          <textarea
            id="message"
            rows={4}
            aria-describedby={cn("message-hint", errors.message && "message-error")}
            aria-invalid={!!errors.message}
            className={cn(inputClass, "h-auto py-3")}
            {...register("message")}
          />
          <FieldError id="message-error" message={errors.message?.message} />
        </div>

        <div className="stack gap-4! border-t border-line pt-6">
          <ConsentBox {...register("smsConsent")}>
            Text me appointment reminders and updates. Message &amp; data rates may apply. Reply STOP
            to opt out at any time.
          </ConsentBox>
          <ConsentBox {...register("marketingConsent")}>
            Send me occasional news and offers by email. Unsubscribe at any time.
          </ConsentBox>
          <ConsentBox
            required
            error={errors.privacyAccepted?.message}
            {...register("privacyAccepted")}
          >
            I have read the <TextLink href="/privacy">privacy policy</TextLink> and agree to be
            contacted about my consultation request.
          </ConsentBox>
        </div>

        <p className="flex items-start gap-2 text-xs text-stone">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Your information is sent securely and used only to arrange your consultation. Consenting
          to texts or marketing is never required.
        </p>
      </div>

      {/* Navigation */}
      <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-8">
        {step > 0 ? (
          <Button type="button" variant="ghost" size="cta" onClick={() => setStep((s) => s - 1)} className="-ml-3">
            <ArrowLeft /> Back
          </Button>
        ) : (
          <span />
        )}
        {step < steps.length - 1 ? (
          <Button type="button" size="cta-lg" onClick={next}>
            Continue <ArrowRight />
          </Button>
        ) : (
          <Button type="submit" size="cta-lg" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="animate-spin" /> Sending…
              </>
            ) : (
              <>
                Request a consultation <ArrowRight />
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}

// ── Field primitives ──────────────────────────────────────────────────────

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-sm text-destructive">
      {message}
    </p>
  );
}

function TextField({
  label,
  error,
  optional,
  ...props
}: React.ComponentProps<"input"> & { label: string; error?: string; optional?: boolean }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex justify-between font-medium text-ink">
        {label}
        {optional && <span className="text-sm font-normal text-stone">Optional</span>}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass}
        {...props}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

/** Toggle chip backed by a real checkbox (keyboard + screen-reader friendly). */
function Chip({ value, ...props }: React.ComponentProps<"input"> & { value: string }) {
  return (
    <label className="relative cursor-pointer">
      <input type="checkbox" value={value} className="peer sr-only" {...props} />
      <span className="inline-flex items-center gap-1.5 rounded-full border border-input bg-white px-4 py-2 text-sm text-ink transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bronze hover:border-stone/60 [&>svg]:hidden peer-checked:[&>svg]:block">
        <Check className="size-3.5" aria-hidden />
        {value}
      </span>
    </label>
  );
}

/** Area card backed by a real checkbox: title, one-line description, check badge. */
function AreaCard({
  title,
  text,
  ...props
}: React.ComponentProps<"input"> & { title: string; text: string }) {
  return (
    <label className="relative cursor-pointer">
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className="flex h-full items-start justify-between gap-4 rounded-sm border border-input bg-white p-5 transition-colors peer-checked:border-bronze peer-checked:bg-cream peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bronze hover:border-stone/60 peer-checked:[&_.badge]:border-bronze peer-checked:[&_.badge]:bg-bronze peer-checked:[&_.badge>svg]:opacity-100">
        <span>
          <span className="block font-heading text-h4 text-ink">{title}</span>
          <span className="mt-1 block text-sm leading-snug text-stone">{text}</span>
        </span>
        <span
          aria-hidden
          className="badge grid size-5 shrink-0 place-items-center rounded-full border border-input bg-white text-white transition-colors"
        >
          <Check className="size-3 opacity-0 transition-opacity" strokeWidth={3} />
        </span>
      </span>
    </label>
  );
}

/** Selectable card backed by a real radio input. */
function OptionCard({
  label,
  hint,
  ...props
}: React.ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className="relative cursor-pointer">
      <input className="peer sr-only" {...props} />
      <span className="flex h-full items-center justify-between gap-3 rounded-sm border border-input bg-white px-5 py-4 transition-colors peer-checked:border-bronze peer-checked:bg-cream peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bronze hover:border-stone/60 peer-checked:[&_.dot]:border-bronze peer-checked:[&_.dot]:bg-bronze">
        <span>
          <span className="block text-ink">{label}</span>
          {hint && <span className="block text-sm text-stone">{hint}</span>}
        </span>
        <span aria-hidden className="dot size-4 shrink-0 rounded-full border border-input bg-white shadow-[inset_0_0_0_3px_white] transition-colors" />
      </span>
    </label>
  );
}

function ConsentBox({
  children,
  error,
  ...props
}: React.ComponentProps<"input"> & { error?: string }) {
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

// ── Success state ─────────────────────────────────────────────────────────

function Success({
  ref,
  firstName,
  demo,
  phone,
}: {
  ref: React.Ref<HTMLHeadingElement>;
  firstName: string;
  demo?: boolean;
  phone: string;
}) {
  return (
    <div className="stack" role="status">
      <span className="grid size-14 place-items-center rounded-full bg-cream text-bronze">
        <Check className="size-6" aria-hidden />
      </span>
      <h2 ref={ref} tabIndex={-1} className="font-heading text-h2 font-light outline-none">
        Thank you, {firstName}.
      </h2>
      <p className="lead">
        Your consultation request has been received. A patient coordinator will contact you within
        one business day to find a time that suits you.
      </p>
      {demo && (
        <p className="border-l-2 border-bronze bg-cream px-4 py-3 text-sm text-stone">
          <strong className="font-medium text-ink">Demo mode:</strong> no database is connected, so
          this request was not stored.
        </p>
      )}
      <ul className="stack gap-3! border-t border-line pt-6 text-sm text-stone">
        <li>
          · Need to talk sooner? Call{" "}
          <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="link-underline">
            {phone}
          </a>
          .
        </li>
      </ul>
      <div data-slot="actions" className="flex flex-wrap gap-3">
        <ButtonLink size="cta" variant="outline" href="/gallery">
          Browse the gallery
        </ButtonLink>
        <ButtonLink size="cta" variant="link" href="/">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
