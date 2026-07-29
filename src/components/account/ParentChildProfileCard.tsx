'use client';

import { useState } from 'react';
import ChildAvatar from '@/components/ChildAvatar';
import AvatarUploadField from '@/components/AvatarUploadField';
import DocumentUploadField from '@/components/DocumentUploadField';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import Button from '@/components/Button';
import FormStatusBanner from '@/components/forms/FormStatusBanner';
import { useFormSubmit } from '@/lib/useFormSubmit';
import { STATUS_LEGEND, CLASS_BAND_LABELS, type ChildStatus, type ClassBand } from '@/lib/family-data';
import { formatDate } from '@/lib/admin-format';
import type { GuardianChildRow } from '@/lib/lms-data';

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="mt-0.5 text-sm text-ink">{value || '—'}</div>
    </div>
  );
}

/** The parent-facing counterpart to the admin/teacher Child Card (src/components/admin/ChildCard.tsx)
 * — same avatar/document-upload building blocks, but a much smaller, permission-scoped slice: only
 * the fields a parent may view or edit for their own linked child. Status, class, programme, and
 * every financial/compliance field are read-only here (or entirely absent) regardless of what's
 * shown — the API enforces this too (updateOwnChildSchema), this is just the matching UI. */
export default function ParentChildProfileCard({ child }: { child: GuardianChildRow }) {
  const [form, setForm] = useState({
    primaryContactEmail: child.primary_contact_email ?? '',
    primaryContactPhone: child.primary_contact_phone ?? '',
    emergencyContactName: child.emergency_contact_name ?? '',
    emergencyContactPhone: child.emergency_contact_phone ?? '',
    allergiesMedicalNotes: child.allergies_medical_notes ?? '',
    dietaryRequirements: child.dietary_requirements ?? '',
    lunchOption: child.lunch_option ?? '',
    homeLanguage: child.home_language ?? '',
    previousSchool: child.previous_school ?? '',
  });
  const [photoUrl, setPhotoUrl] = useState(child.photo_url);
  const [passportCopyUrl, setPassportCopyUrl] = useState(child.passport_copy_url);
  const [kitasCopyUrl, setKitasCopyUrl] = useState(child.kitas_copy_url);
  const [birthCertificateUrl, setBirthCertificateUrl] = useState(child.birth_certificate_url);

  const { status, errorMessage, submit } = useFormSubmit<{ ok: true }>(`/api/account/children/${child.id}`);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveProfile() {
    await submit(form);
  }

  async function savePhoto(url: string) {
    setPhotoUrl(url);
    await submit({ photoUrl: url });
  }

  async function saveDocument(field: 'passportCopyUrl' | 'kitasCopyUrl' | 'birthCertificateUrl', url: string, setter: (url: string) => void) {
    setter(url);
    await submit({ [field]: url });
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex flex-wrap items-start gap-4">
        <AvatarUploadField
          childId={child.id}
          currentUrl={photoUrl}
          name={child.child_full_name}
          uploadEndpoint={`/api/account/children/${child.id}/upload?kind=avatar`}
          onUploaded={savePhoto}
        />
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            {child.child_nickname || child.child_full_name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${STATUS_LEGEND[child.status as ChildStatus].badgeClass}`}>
              <span className={`h-2 w-2 rounded-full ${STATUS_LEGEND[child.status as ChildStatus].dotClass}`} />
              {STATUS_LEGEND[child.status as ChildStatus].label}
            </span>
            {child.class_name && (
              <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal-deep">
                {child.class_name}
                {child.class_band && ` · ${CLASS_BAND_LABELS[child.class_band as ClassBand]}`}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 border-t border-sand-line pt-6 sm:grid-cols-3">
        <InfoRow label="Date of birth" value={child.dob ? formatDate(child.dob) : null} />
        <InfoRow label="Nationality" value={child.nationality} />
        <InfoRow label="Programme" value={child.programme} />
        <InfoRow label="Parent 1" value={[child.parent1_name, child.parent1_relationship].filter(Boolean).join(' — ')} />
        <InfoRow label="Parent 2" value={[child.parent2_name, child.parent2_relationship].filter(Boolean).join(' — ')} />
        <InfoRow label="Religion" value={child.religion} />
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        These details are set by the school office. Contact us if anything above needs correcting.
      </p>

      <div className="mt-6 border-t border-sand-line pt-6">
        <h3 className="font-display text-base font-semibold text-ink">Contact & Care Details</h3>
        <p className="mt-1 text-xs text-ink-soft">You can update these yourself at any time.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Contact email" htmlFor="loo-contact-email">
            <TextInput id="loo-contact-email" type="email" value={form.primaryContactEmail} onChange={(e) => set('primaryContactEmail', e.target.value)} />
          </Field>
          <Field label="Contact phone" htmlFor="loo-contact-phone">
            <TextInput id="loo-contact-phone" value={form.primaryContactPhone} onChange={(e) => set('primaryContactPhone', e.target.value)} />
          </Field>
          <Field label="Emergency contact name" htmlFor="loo-emergency-name">
            <TextInput id="loo-emergency-name" value={form.emergencyContactName} onChange={(e) => set('emergencyContactName', e.target.value)} />
          </Field>
          <Field label="Emergency contact phone" htmlFor="loo-emergency-phone">
            <TextInput id="loo-emergency-phone" value={form.emergencyContactPhone} onChange={(e) => set('emergencyContactPhone', e.target.value)} />
          </Field>
          <Field label="Home language" htmlFor="loo-home-language">
            <TextInput id="loo-home-language" value={form.homeLanguage} onChange={(e) => set('homeLanguage', e.target.value)} />
          </Field>
          <Field label="Previous school" htmlFor="loo-previous-school">
            <TextInput id="loo-previous-school" value={form.previousSchool} onChange={(e) => set('previousSchool', e.target.value)} />
          </Field>
          <Field label="Dietary requirements" htmlFor="loo-dietary">
            <TextInput id="loo-dietary" value={form.dietaryRequirements} onChange={(e) => set('dietaryRequirements', e.target.value)} />
          </Field>
          <Field label="Lunch choice" htmlFor="loo-lunch">
            <TextInput id="loo-lunch" value={form.lunchOption} onChange={(e) => set('lunchOption', e.target.value)} placeholder="e.g. Bring own, Godspeed order" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Allergies / medical notes" htmlFor="loo-allergies">
            <TextArea id="loo-allergies" rows={2} value={form.allergiesMedicalNotes} onChange={(e) => set('allergiesMedicalNotes', e.target.value)} />
          </Field>
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          Changes to allergies, dietary requirements, or lunch choice notify the school office and your
          child&apos;s teacher(s) right away, since this is safety information.
        </p>

        <FormStatusBanner status={status} errorMessage={errorMessage} successMessage="Saved." />
        <div className="mt-3">
          <Button type="button" variant="primary" onClick={saveProfile} disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      <div className="mt-6 border-t border-sand-line pt-6">
        <h3 className="font-display text-base font-semibold text-ink">Identity Documents</h3>
        <p className="mt-1 text-xs text-ink-soft">
          Visible only to you and school admin — never to teachers. Not part of the Forms &amp; Compliance
          checklist the school tracks separately.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Passport copy" htmlFor="loo-passport">
            <DocumentUploadField
              currentUrl={passportCopyUrl}
              pathPrefix={`children/${child.id}/passport`}
              label="Passport"
              uploadEndpoint={`/api/account/children/${child.id}/upload?kind=document`}
              onUploaded={(url) => saveDocument('passportCopyUrl', url, setPassportCopyUrl)}
            />
          </Field>
          <Field label="KITAS copy" htmlFor="loo-kitas">
            <DocumentUploadField
              currentUrl={kitasCopyUrl}
              pathPrefix={`children/${child.id}/kitas`}
              label="KITAS"
              uploadEndpoint={`/api/account/children/${child.id}/upload?kind=document`}
              onUploaded={(url) => saveDocument('kitasCopyUrl', url, setKitasCopyUrl)}
            />
          </Field>
          <Field label="Birth certificate" htmlFor="loo-birth-certificate">
            <DocumentUploadField
              currentUrl={birthCertificateUrl}
              pathPrefix={`children/${child.id}/birth-certificate`}
              label="Birth certificate"
              uploadEndpoint={`/api/account/children/${child.id}/upload?kind=document`}
              onUploaded={(url) => saveDocument('birthCertificateUrl', url, setBirthCertificateUrl)}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
