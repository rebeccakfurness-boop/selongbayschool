'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';

export default function LetterOfOfferForm({
  letterId,
  childId,
  initialStartDate,
  initialProgramme,
  initialClassName,
  initialTuitionPlan,
  initialFeesNote,
  initialAdditionalTerms,
  redirectTo,
}: {
  /** Set when editing an existing letter (PUT); omitted when creating a new one (POST). */
  letterId?: number;
  /** Only needed when creating. */
  childId?: number;
  initialStartDate: string;
  initialProgramme: string;
  initialClassName: string;
  initialTuitionPlan: string;
  initialFeesNote: string;
  initialAdditionalTerms: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const isEditing = letterId !== undefined;
  const [startDate, setStartDate] = useState(initialStartDate);
  const [programme, setProgramme] = useState(initialProgramme);
  const [className, setClassName] = useState(initialClassName);
  const [tuitionPlan, setTuitionPlan] = useState(initialTuitionPlan);
  const [feesNote, setFeesNote] = useState(initialFeesNote);
  const [additionalTerms, setAdditionalTerms] = useState(initialAdditionalTerms);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...(isEditing ? {} : { childId }),
        startDate,
        programme: programme || null,
        className: className || null,
        tuitionPlan: tuitionPlan || null,
        feesNote: feesNote || null,
        additionalTerms: additionalTerms || null,
      };
      const res = await fetch(isEditing ? `/api/admin/letters-of-offer/${letterId}` : '/api/admin/letters-of-offer', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed to ${isEditing ? 'save' : 'create'} letter of offer`);
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEditing ? 'save' : 'create'} letter of offer`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date" htmlFor="loo-start-date" required>
            <TextInput id="loo-start-date" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Programme" htmlFor="loo-programme">
            <TextInput id="loo-programme" value={programme} onChange={(e) => setProgramme(e.target.value)} />
          </Field>
          <Field label="Class" htmlFor="loo-class-name">
            <TextInput id="loo-class-name" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. Stars, Grade 6" />
          </Field>
          <Field label="Tuition plan" htmlFor="loo-tuition-plan">
            <TextInput id="loo-tuition-plan" value={tuitionPlan} onChange={(e) => setTuitionPlan(e.target.value)} placeholder="e.g. Full year, per term" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Fees note" htmlFor="loo-fees-note">
            <TextArea id="loo-fees-note" rows={2} value={feesNote} onChange={(e) => setFeesNote(e.target.value)} placeholder="Any fee details to mention on the letter" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Additional terms" htmlFor="loo-additional-terms">
            <TextArea
              id="loo-additional-terms"
              rows={4}
              value={additionalTerms}
              onChange={(e) => setAdditionalTerms(e.target.value)}
              placeholder="Anything else to include in the letter (conditions, notes, etc.)"
            />
          </Field>
        </div>
      </div>

      {error && <p role="alert" className="font-semibold text-orange-deep">{error}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="primary" onClick={submit} disabled={saving || !startDate}>
          {saving ? (isEditing ? 'Saving…' : 'Creating…') : isEditing ? 'Save changes' : 'Create letter of offer'}
        </Button>
        <Button href={redirectTo} variant="ghost">
          Cancel
        </Button>
      </div>
    </div>
  );
}
