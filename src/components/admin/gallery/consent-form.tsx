"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateConsent } from "@/app/admin/gallery/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { consentScopes, type ConsentScope } from "@/lib/gallery/meta";
import type { ConsentFields } from "@/lib/gallery/schemas";
import { selectClass } from "./case-details-form";

/**
 * Photo consent. Approving a case requires it. Unticking it on a published case hides the case
 * immediately (consent withdrawn).
 */
export function ConsentForm({
  caseId,
  defaults,
  recorded,
  published,
}: {
  caseId: number;
  defaults: ConsentFields;
  /** e.g. "Recorded 19 Nov 2026, 10:42 by you" */
  recorded?: string;
  published: boolean;
}) {
  const [values, setValues] = useState(defaults);
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(values) !== JSON.stringify(defaults);
  const withdrawing = published && defaults.consentSigned && !values.consentSigned;

  function save() {
    startTransition(async () => {
      const result = await updateConsent(caseId, values);
      if (!result.ok) toast.error(result.error);
      else toast.success(withdrawing ? "Consent withdrawn. The case is now hidden." : "Consent saved");
    });
  }

  return (
    <div className="space-y-5">
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-bronze"
          checked={values.consentSigned}
          onChange={(e) => setValues({ ...values, consentSigned: e.target.checked })}
        />
        <span>
          <span className="font-medium text-ink">Written photo consent signed</span>
          <span className="block text-stone">
            The patient signed the clinic’s photo authorization for these images. Keep the signed form in the
            patient record, not here.
          </span>
          {recorded && defaults.consentSigned && <span className="mt-1 block text-xs text-stone">{recorded}</span>}
        </span>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="consentScope">Consent covers</Label>
          <select
            id="consentScope"
            className={selectClass}
            value={values.consentScope}
            onChange={(e) => setValues({ ...values, consentScope: e.target.value as ConsentScope })}
          >
            {Object.entries(consentScopes).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-start gap-3 pt-6 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-bronze"
            checked={values.showFace}
            onChange={(e) => setValues({ ...values, showFace: e.target.checked })}
          />
          <span>
            Patient agreed to show their face
            <span className="block text-xs text-stone">If not, crop or mask the face before uploading.</span>
          </span>
        </label>
      </div>

      {withdrawing && (
        <p role="alert" className="rounded-sm border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Saving will withdraw consent and hide this case from the website straight away.
        </p>
      )}
      <Button type="button" variant={withdrawing ? "destructive" : "default"} disabled={pending || !dirty} onClick={save}>
        {withdrawing ? "Withdraw consent and hide" : "Save consent"}
      </Button>
    </div>
  );
}
