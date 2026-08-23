'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import { STATUS_LEGEND, STATUS_ORDER, CLASS_BAND_LABELS, CLASS_BAND_ORDER, type ChildStatus, type ClassBand } from '@/lib/family-data';

export interface NewChildFormPrefill {
  childFullName?: string;
  parent1Name?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  allergiesMedicalNotes?: string;
}

export default function NewChildForm({
  prefill,
  admissionsEnquiryId,
  onCreated,
  onCancel,
}: {
  /** Pre-fills the form from an admissions_enquiries lead — everything the admissions team
   * already typed during the tour/interview stage, so converting a lead never means retyping it.
   * Still a normal editable form after that: the admin can fix a messy name before submitting. */
  prefill?: NewChildFormPrefill;
  /** When set, submits to the "Convert to Family" endpoint (which also marks the lead converted)
   * instead of the blank-form create endpoint. */
  admissionsEnquiryId?: number;
  /** Defaults to redirecting to the new Child Card; the conversion modal overrides this to close
   * itself and refresh the Admissions Pipeline table instead. */
  onCreated?: (childId: number) => void;
  /** Defaults to a link back to the board; the conversion modal overrides this to just close. */
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [childFullName, setChildFullName] = useState(prefill?.childFullName ?? '');
  const [childNickname, setChildNickname] = useState('');
  const [status, setStatus] = useState<ChildStatus>('enquiry');
  const [classBand, setClassBand] = useState<ClassBand | ''>('');
  const [className, setClassName] = useState('');
  const [dob, setDob] = useState('');
  const [nationality, setNationality] = useState('');
  const [enrolmentDate, setEnrolmentDate] = useState('');
  const [parent1Name, setParent1Name] = useState(prefill?.parent1Name ?? '');
  const [parent2Name, setParent2Name] = useState('');
  const [primaryContactEmail, setPrimaryContactEmail] = useState(prefill?.primaryContactEmail ?? '');
  const [primaryContactPhone, setPrimaryContactPhone] = useState(prefill?.primaryContactPhone ?? '');
  const [allergiesMedicalNotes, setAllergiesMedicalNotes] = useState(prefill?.allergiesMedicalNotes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const endpoint = admissionsEnquiryId
        ? `/api/admin/admissions-enquiries/${admissionsEnquiryId}/convert`
        : '/api/admin/children';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childFullName,
          childNickname: childNickname || null,
          status,
          classBand: classBand || null,
          className: className || null,
          dob: dob || null,
          nationality: nationality || null,
          enrolmentDate: enrolmentDate || null,
          parent1Name: parent1Name || null,
          parent2Name: parent2Name || null,
          primaryContactEmail: primaryContactEmail || null,
          primaryContactPhone: primaryContactPhone || null,
          allergiesMedicalNotes: allergiesMedicalNotes || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create child');
      if (onCreated) {
        onCreated(data.id);
      } else {
        router.push(`/admin/families/${data.id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create child');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Full name" htmlFor="new-child-full-name" required>
          <TextInput id="new-child-full-name" required value={childFullName} onChange={(e) => setChildFullName(e.target.value)} />
        </Field>
        <Field label="Nickname" htmlFor="new-child-nickname">
          <TextInput id="new-child-nickname" value={childNickname} onChange={(e) => setChildNickname(e.target.value)} />
        </Field>
        {admissionsEnquiryId ? (
          <Field label="Status" htmlFor="new-child-status">
            <p className="rounded-sm border border-sand-line bg-sand/20 px-4 py-2.5 text-[15px] text-ink-soft">
              Enquiry (drag to Booking once it&apos;s a confirmed booking)
            </p>
          </Field>
        ) : (
          <Field label="Status" htmlFor="new-child-status">
            <select
              id="new-child-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ChildStatus)}
              className="rounded-sm border border-sand-line bg-white px-4 py-2.5 text-[15px] text-ink"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{STATUS_LEGEND[s].label}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Class band" htmlFor="new-child-class-band">
          <select
            id="new-child-class-band"
            value={classBand}
            onChange={(e) => setClassBand(e.target.value as ClassBand | '')}
            className="rounded-sm border border-sand-line bg-white px-4 py-2.5 text-[15px] text-ink"
          >
            <option value="">Not set</option>
            {CLASS_BAND_ORDER.map((band) => (
              <option key={band} value={band}>{CLASS_BAND_LABELS[band]}</option>
            ))}
          </select>
        </Field>
        <Field label="Class name" htmlFor="new-child-class-name">
          <TextInput id="new-child-class-name" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. Stars, Grade 6" />
        </Field>
        <Field label="Date of birth" htmlFor="new-child-dob">
          <TextInput id="new-child-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </Field>
        <Field label="Nationality" htmlFor="new-child-nationality">
          <TextInput id="new-child-nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} />
        </Field>
        <Field label="Enrolment date" htmlFor="new-child-enrolment-date">
          <TextInput id="new-child-enrolment-date" type="date" value={enrolmentDate} onChange={(e) => setEnrolmentDate(e.target.value)} />
        </Field>
        <Field label="Parent 1 name" htmlFor="new-child-parent1">
          <TextInput id="new-child-parent1" value={parent1Name} onChange={(e) => setParent1Name(e.target.value)} />
        </Field>
        <Field label="Parent 2 name" htmlFor="new-child-parent2">
          <TextInput id="new-child-parent2" value={parent2Name} onChange={(e) => setParent2Name(e.target.value)} />
        </Field>
        <Field label="Contact email" htmlFor="new-child-contact-email">
          <TextInput id="new-child-contact-email" type="email" value={primaryContactEmail} onChange={(e) => setPrimaryContactEmail(e.target.value)} />
        </Field>
        <Field label="Contact phone" htmlFor="new-child-contact-phone">
          <TextInput id="new-child-contact-phone" value={primaryContactPhone} onChange={(e) => setPrimaryContactPhone(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Allergies / medical notes" htmlFor="new-child-allergies">
          <TextArea id="new-child-allergies" rows={2} value={allergiesMedicalNotes} onChange={(e) => setAllergiesMedicalNotes(e.target.value)} />
        </Field>
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        Compliance forms, immigration documents, and everything else can be filled in on the child&apos;s card after creating it.
      </p>

      {error && <p role="alert" className="mt-4 font-semibold text-orange-deep">{error}</p>}
      <div className="mt-4 flex gap-3">
        <Button type="button" variant="primary" onClick={save} disabled={saving || !childFullName.trim()}>
          {saving ? 'Creating…' : admissionsEnquiryId ? 'Convert to family' : 'Create child card'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button href="/admin/families" variant="ghost">
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
