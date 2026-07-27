'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import DocumentUploadField from '@/components/admin/DocumentUploadField';
import WorkSamplesSection, { type WorkSample } from '@/components/admin/WorkSamplesSection';
import ChildPhotoFeedSection, { type PhotoFeedItem } from '@/components/admin/ChildPhotoFeedSection';
import GuardianLinksSection, { type GuardianLink } from '@/components/admin/GuardianLinksSection';
import InvoicesSection from '@/components/admin/InvoicesSection';
import ClassroomSection from '@/components/admin/ClassroomSection';
import type { InvoiceSummaryRow, ClassroomSubmissionRow } from '@/lib/lms-data';
import { formatDate } from '@/lib/admin-format';
import { STATUS_LEGEND, STATUS_ORDER, CLASS_BAND_LABELS, CLASS_BAND_ORDER, COMPLIANCE_ITEMS, type ChildStatus, type ClassBand } from '@/lib/family-data';

export interface ChildDetail {
  id: number;
  family_id: string | null;
  status: ChildStatus;
  is_active: boolean;
  programme: string | null;
  class_band: ClassBand | null;
  class_name: string | null;
  child_full_name: string;
  child_nickname: string | null;
  dob: string | null;
  gender: string | null;
  nationality: string | null;
  enrolment_date: string | null;
  exit_date: string | null;
  parent1_name: string | null;
  parent1_relationship: string | null;
  parent1_nationality: string | null;
  parent2_name: string | null;
  parent2_relationship: string | null;
  parent2_nationality: string | null;
  siblings_at_school: string | null;
  sibling_discount_tier: string | null;
  tuition_plan: string | null;
  payment_status: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  allergies_medical_notes: string | null;
  dietary_requirements: string | null;
  religion: string | null;
  home_language: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  duration_of_stay_note: string | null;
  nisn_request_signed: boolean;
  nisn_request_date: string | null;
  nisn_number: string | null;
  liability_form_signed: boolean;
  liability_form_date: string | null;
  photography_signed: boolean;
  photography_consent: string | null;
  photography_form_date: string | null;
  pickup_authorization_signed: boolean;
  authorized_pickup_persons: string | null;
  pickup_form_date: string | null;
  behavioral_form_signed: boolean;
  behavioral_form_date: string | null;
  financial_agreement_signed: boolean;
  financial_agreement_date: string | null;
  parent_protection_addendum_signed: boolean;
  data_consent_signed: boolean;
  passport_copy_url: string | null;
  visa_status: string | null;
  kitas_copy_url: string | null;
  classroom_student_email: string | null;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="mt-0.5 text-sm text-ink">{value || '—'}</div>
    </div>
  );
}

/** Local editable copy of the fields this form covers — camelCase keys matching updateChildSchema,
 * seeded from the snake_case ChildDetail the server sent down. */
function toFormState(child: ChildDetail) {
  return {
    status: child.status,
    isActive: child.is_active,
    programme: child.programme ?? '',
    classBand: child.class_band ?? '',
    className: child.class_name ?? '',
    childFullName: child.child_full_name,
    childNickname: child.child_nickname ?? '',
    dob: child.dob ?? '',
    gender: child.gender ?? '',
    nationality: child.nationality ?? '',
    enrolmentDate: child.enrolment_date ?? '',
    exitDate: child.exit_date ?? '',
    parent1Name: child.parent1_name ?? '',
    parent1Relationship: child.parent1_relationship ?? '',
    parent1Nationality: child.parent1_nationality ?? '',
    parent2Name: child.parent2_name ?? '',
    parent2Relationship: child.parent2_relationship ?? '',
    parent2Nationality: child.parent2_nationality ?? '',
    siblingsAtSchool: child.siblings_at_school ?? '',
    siblingDiscountTier: child.sibling_discount_tier ?? '',
    tuitionPlan: child.tuition_plan ?? '',
    paymentStatus: child.payment_status ?? '',
    emergencyContactName: child.emergency_contact_name ?? '',
    emergencyContactPhone: child.emergency_contact_phone ?? '',
    allergiesMedicalNotes: child.allergies_medical_notes ?? '',
    dietaryRequirements: child.dietary_requirements ?? '',
    religion: child.religion ?? '',
    homeLanguage: child.home_language ?? '',
    primaryContactEmail: child.primary_contact_email ?? '',
    primaryContactPhone: child.primary_contact_phone ?? '',
    nisnRequestSigned: child.nisn_request_signed,
    nisnRequestDate: child.nisn_request_date ?? '',
    nisnNumber: child.nisn_number ?? '',
    liabilityFormSigned: child.liability_form_signed,
    liabilityFormDate: child.liability_form_date ?? '',
    photographySigned: child.photography_signed,
    photographyConsent: child.photography_consent ?? '',
    photographyFormDate: child.photography_form_date ?? '',
    pickupAuthorizationSigned: child.pickup_authorization_signed,
    authorizedPickupPersons: child.authorized_pickup_persons ?? '',
    pickupFormDate: child.pickup_form_date ?? '',
    behavioralFormSigned: child.behavioral_form_signed,
    behavioralFormDate: child.behavioral_form_date ?? '',
    financialAgreementSigned: child.financial_agreement_signed,
    financialAgreementDate: child.financial_agreement_date ?? '',
    parentProtectionAddendumSigned: child.parent_protection_addendum_signed,
    dataConsentSigned: child.data_consent_signed,
    passportCopyUrl: child.passport_copy_url,
    visaStatus: child.visa_status ?? '',
    kitasCopyUrl: child.kitas_copy_url,
    classroomStudentEmail: child.classroom_student_email ?? '',
  };
}

type FormState = ReturnType<typeof toFormState>;

const COMPLIANCE_FIELD_MAP: Record<string, { signed: keyof FormState; date: keyof FormState | null }> = {
  liability_form_signed: { signed: 'liabilityFormSigned', date: 'liabilityFormDate' },
  photography_signed: { signed: 'photographySigned', date: 'photographyFormDate' },
  pickup_authorization_signed: { signed: 'pickupAuthorizationSigned', date: 'pickupFormDate' },
  behavioral_form_signed: { signed: 'behavioralFormSigned', date: 'behavioralFormDate' },
  financial_agreement_signed: { signed: 'financialAgreementSigned', date: 'financialAgreementDate' },
  parent_protection_addendum_signed: { signed: 'parentProtectionAddendumSigned', date: null },
  data_consent_signed: { signed: 'dataConsentSigned', date: null },
};

export default function ChildCard({
  child,
  canEdit,
  learningProfileCount,
  workSamples,
  photos,
  guardians,
  invoices,
  classroomSubmissions,
}: {
  child: ChildDetail;
  canEdit: boolean;
  learningProfileCount: number;
  workSamples: WorkSample[];
  photos: PhotoFeedItem[];
  guardians: GuardianLink[];
  invoices: InvoiceSummaryRow[];
  classroomSubmissions: ClassroomSubmissionRow[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => toFormState(child));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadDocument(field: 'passportCopyUrl' | 'kitasCopyUrl', url: string) {
    set(field, url);
    try {
      await fetch(`/api/admin/children/${child.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: url }),
      });
      router.refresh();
    } catch {
      setError('Uploaded, but failed to save the link — try Save changes below.');
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/children/${child.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          classBand: form.classBand || null,
          dob: form.dob || null,
          enrolmentDate: form.enrolmentDate || null,
          exitDate: form.exitDate || null,
          nisnRequestDate: form.nisnRequestDate || null,
          liabilityFormDate: form.liabilityFormDate || null,
          photographyFormDate: form.photographyFormDate || null,
          pickupFormDate: form.pickupFormDate || null,
          behavioralFormDate: form.behavioralFormDate || null,
          financialAgreementDate: form.financialAgreementDate || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const signedCount = COMPLIANCE_ITEMS.filter((item) => child[item.signedKey as keyof ChildDetail]).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <div>
          <p className="font-script text-2xl text-orange-deep">{child.child_nickname || child.child_full_name}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{child.child_full_name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${STATUS_LEGEND[child.status].badgeClass}`}>
              <span className={`h-2 w-2 rounded-full ${STATUS_LEGEND[child.status].dotClass}`} />
              {STATUS_LEGEND[child.status].label}
            </span>
            {!child.is_active && (
              <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-bold text-ink-soft">Inactive</span>
            )}
            {child.class_name && (
              <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal-deep">
                {child.class_name}
                {child.class_band && ` · ${CLASS_BAND_LABELS[child.class_band]}`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/families" className="text-sm font-semibold text-teal-deep hover:underline">
            ← Back to board
          </Link>
          {canEdit && !editing && (
            <Button type="button" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>
      </div>

      {!editing ? (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold text-ink">Child & Class Info</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <InfoRow label="Date of birth" value={child.dob ? formatDate(child.dob) : null} />
                <InfoRow label="Gender" value={child.gender} />
                <InfoRow label="Nationality" value={child.nationality} />
                <InfoRow label="Programme" value={child.programme} />
                <InfoRow label="Enrolment date" value={child.enrolment_date ? formatDate(child.enrolment_date) : null} />
                <InfoRow label="Exit / withdrawal date" value={child.exit_date ? formatDate(child.exit_date) : null} />
                <InfoRow label="Home language" value={child.home_language} />
                <InfoRow label="Religion" value={child.religion} />
              </div>
            </div>

            <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold text-ink">Parent / Guardian Info</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <InfoRow label="Parent 1" value={[child.parent1_name, child.parent1_relationship].filter(Boolean).join(' — ')} />
                <InfoRow label="Parent 1 nationality" value={child.parent1_nationality} />
                <InfoRow label="Parent 2" value={[child.parent2_name, child.parent2_relationship].filter(Boolean).join(' — ')} />
                <InfoRow label="Parent 2 nationality" value={child.parent2_nationality} />
                <InfoRow label="Contact email" value={child.primary_contact_email} />
                <InfoRow label="Contact phone" value={child.primary_contact_phone} />
                <InfoRow label="Emergency contact" value={child.emergency_contact_name} />
                <InfoRow label="Emergency phone" value={child.emergency_contact_phone} />
              </div>
            </div>

            <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold text-ink">Family & Financial</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <InfoRow label="Siblings at school" value={child.siblings_at_school} />
                <InfoRow label="Sibling discount tier" value={child.sibling_discount_tier} />
                <InfoRow label="Tuition plan" value={child.tuition_plan} />
                <InfoRow label="Payment status" value={child.payment_status} />
              </div>
            </div>

            <InvoicesSection childId={child.id} invoices={invoices} canEdit={canEdit} />

            {canEdit && (
              <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
                <h2 className="font-display text-lg font-semibold text-ink">Immigration Documents</h2>
                <p className="mt-1 text-xs text-ink-soft">Admin-only — not shown on the teacher view of this card.</p>
                <div className="mt-4 grid grid-cols-1 gap-4">
                  <InfoRow label="Visa status" value={child.visa_status} />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">Passport copy</div>
                    <div className="mt-1">
                      {child.passport_copy_url ? (
                        <a href={child.passport_copy_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-teal-deep underline">
                          View passport copy
                        </a>
                      ) : (
                        <span className="text-sm text-ink-soft">Not uploaded</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">KITAS copy</div>
                    <div className="mt-1">
                      {child.kitas_copy_url ? (
                        <a href={child.kitas_copy_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-teal-deep underline">
                          View KITAS copy
                        </a>
                      ) : (
                        <span className="text-sm text-ink-soft">Not uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold text-ink">Health & Personal</h2>
              <div className="mt-4 grid grid-cols-1 gap-4">
                {child.allergies_medical_notes && (
                  <div className="rounded-sm bg-orange/10 px-3 py-2 text-sm font-semibold text-orange-deep">
                    ⚠ {child.allergies_medical_notes}
                  </div>
                )}
                <InfoRow label="Dietary requirements" value={child.dietary_requirements} />
                <InfoRow label="Duration of stay note" value={child.duration_of_stay_note} />
              </div>
              <div className="mt-4 rounded-sm border border-dashed border-sand-line p-3 text-xs text-ink-soft">
                Lunch selection is coming in a later phase.
              </div>
            </div>
          </div>

          <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Forms & Compliance</h2>
              <span className="text-sm font-bold text-ink-soft">{signedCount}/{COMPLIANCE_ITEMS.length} signed</span>
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {COMPLIANCE_ITEMS.map((item) => {
                const signed = Boolean(child[item.signedKey as keyof ChildDetail]);
                const dateValue = item.dateKey ? (child[item.dateKey as keyof ChildDetail] as string | null) : null;
                return (
                  <li
                    key={item.signedKey}
                    className={`flex items-center justify-between gap-2 rounded-sm px-3 py-2 text-sm ${
                      signed ? 'bg-teal/10 text-teal-deep' : 'bg-orange/10 text-orange-deep'
                    }`}
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="whitespace-nowrap text-xs font-bold">
                      {signed ? `Signed${dateValue ? ` ${formatDate(dateValue)}` : ''}` : 'Not signed'}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 grid gap-4 border-t border-sand-line pt-4 sm:grid-cols-3">
              <InfoRow label="NISN request" value={child.nisn_request_signed ? 'Signed' : 'Not signed'} />
              <InfoRow label="NISN number" value={child.nisn_number} />
              <InfoRow label="Authorized pickup persons" value={child.authorized_pickup_persons} />
            </div>
          </div>

          <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-ink">Learning Profile</h3>
              <span className="text-sm font-bold text-ink-soft">{learningProfileCount} term report{learningProfileCount === 1 ? '' : 's'}</span>
            </div>
            <div className="mt-3 flex gap-3">
              <Link href={`/admin/families/${child.id}/learning-profile`} className="text-sm font-semibold text-teal-deep hover:underline">
                View reports
              </Link>
              {canEdit && (
                <Link href={`/admin/families/${child.id}/learning-profile/new`} className="text-sm font-semibold text-teal-deep hover:underline">
                  + New term report
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <WorkSamplesSection childId={child.id} initial={workSamples} canEdit={canEdit} />
            <ChildPhotoFeedSection childId={child.id} initial={photos} canEdit={canEdit} />
          </div>

          <ClassroomSection classroomStudentEmail={child.classroom_student_email} submissions={classroomSubmissions} />

          <div className="rounded-md border border-dashed border-sand-line bg-paper p-6 text-sm text-ink-soft">
            <h3 className="font-display text-base font-semibold text-ink">Activities</h3>
            <p className="mt-2">Booked extracurricular activities are coming in a later phase.</p>
          </div>

          {canEdit && <GuardianLinksSection childId={child.id} initial={guardians} />}
        </>
      ) : (
        <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Full name" htmlFor="edit-full-name" required>
              <TextInput id="edit-full-name" required value={form.childFullName} onChange={(e) => set('childFullName', e.target.value)} />
            </Field>
            <Field label="Nickname" htmlFor="edit-nickname">
              <TextInput id="edit-nickname" value={form.childNickname} onChange={(e) => set('childNickname', e.target.value)} />
            </Field>
            <Field label="Status" htmlFor="edit-status">
              <select
                id="edit-status"
                value={form.status}
                onChange={(e) => set('status', e.target.value as ChildStatus)}
                className="rounded-sm border border-sand-line bg-white px-4 py-2.5 font-sans text-[15px] text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{STATUS_LEGEND[s].label}</option>
                ))}
              </select>
            </Field>
            <Field label="Active" htmlFor="edit-active">
              <select
                id="edit-active"
                value={form.isActive ? 'true' : 'false'}
                onChange={(e) => set('isActive', e.target.value === 'true')}
                className="rounded-sm border border-sand-line bg-white px-4 py-2.5 font-sans text-[15px] text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </Field>
            <Field label="Class band" htmlFor="edit-class-band">
              <select
                id="edit-class-band"
                value={form.classBand}
                onChange={(e) => set('classBand', e.target.value as ClassBand | '')}
                className="rounded-sm border border-sand-line bg-white px-4 py-2.5 font-sans text-[15px] text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                <option value="">Not set</option>
                {CLASS_BAND_ORDER.map((band) => (
                  <option key={band} value={band}>{CLASS_BAND_LABELS[band]}</option>
                ))}
              </select>
            </Field>
            <Field label="Class name" htmlFor="edit-class-name">
              <TextInput id="edit-class-name" value={form.className} onChange={(e) => set('className', e.target.value)} placeholder="e.g. Stars, Grade 6" />
            </Field>
            <Field label="Programme" htmlFor="edit-programme">
              <TextInput id="edit-programme" value={form.programme} onChange={(e) => set('programme', e.target.value)} />
            </Field>
            <Field label="Date of birth" htmlFor="edit-dob">
              <TextInput id="edit-dob" type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} />
            </Field>
            <Field label="Gender" htmlFor="edit-gender">
              <TextInput id="edit-gender" value={form.gender} onChange={(e) => set('gender', e.target.value)} />
            </Field>
            <Field label="Nationality" htmlFor="edit-nationality">
              <TextInput id="edit-nationality" value={form.nationality} onChange={(e) => set('nationality', e.target.value)} />
            </Field>
            <Field label="Enrolment date" htmlFor="edit-enrolment-date">
              <TextInput id="edit-enrolment-date" type="date" value={form.enrolmentDate} onChange={(e) => set('enrolmentDate', e.target.value)} />
            </Field>
            <Field label="Exit / withdrawal date" htmlFor="edit-exit-date">
              <TextInput id="edit-exit-date" type="date" value={form.exitDate} onChange={(e) => set('exitDate', e.target.value)} />
            </Field>
            <Field label="Home language" htmlFor="edit-home-language">
              <TextInput id="edit-home-language" value={form.homeLanguage} onChange={(e) => set('homeLanguage', e.target.value)} />
            </Field>
            <Field label="Religion" htmlFor="edit-religion">
              <TextInput id="edit-religion" value={form.religion} onChange={(e) => set('religion', e.target.value)} />
            </Field>

            <Field label="Parent 1 name" htmlFor="edit-parent1-name">
              <TextInput id="edit-parent1-name" value={form.parent1Name} onChange={(e) => set('parent1Name', e.target.value)} />
            </Field>
            <Field label="Parent 1 relationship" htmlFor="edit-parent1-rel">
              <TextInput id="edit-parent1-rel" value={form.parent1Relationship} onChange={(e) => set('parent1Relationship', e.target.value)} />
            </Field>
            <Field label="Parent 1 nationality" htmlFor="edit-parent1-nat">
              <TextInput id="edit-parent1-nat" value={form.parent1Nationality} onChange={(e) => set('parent1Nationality', e.target.value)} />
            </Field>
            <Field label="Parent 2 name" htmlFor="edit-parent2-name">
              <TextInput id="edit-parent2-name" value={form.parent2Name} onChange={(e) => set('parent2Name', e.target.value)} />
            </Field>
            <Field label="Parent 2 relationship" htmlFor="edit-parent2-rel">
              <TextInput id="edit-parent2-rel" value={form.parent2Relationship} onChange={(e) => set('parent2Relationship', e.target.value)} />
            </Field>
            <Field label="Parent 2 nationality" htmlFor="edit-parent2-nat">
              <TextInput id="edit-parent2-nat" value={form.parent2Nationality} onChange={(e) => set('parent2Nationality', e.target.value)} />
            </Field>
            <Field label="Contact email" htmlFor="edit-contact-email">
              <TextInput id="edit-contact-email" type="email" value={form.primaryContactEmail} onChange={(e) => set('primaryContactEmail', e.target.value)} />
            </Field>
            <Field label="Contact phone" htmlFor="edit-contact-phone">
              <TextInput id="edit-contact-phone" value={form.primaryContactPhone} onChange={(e) => set('primaryContactPhone', e.target.value)} />
            </Field>
            <Field label="Emergency contact name" htmlFor="edit-emergency-name">
              <TextInput id="edit-emergency-name" value={form.emergencyContactName} onChange={(e) => set('emergencyContactName', e.target.value)} />
            </Field>
            <Field label="Emergency contact phone" htmlFor="edit-emergency-phone">
              <TextInput id="edit-emergency-phone" value={form.emergencyContactPhone} onChange={(e) => set('emergencyContactPhone', e.target.value)} />
            </Field>

            <Field label="Siblings at school" htmlFor="edit-siblings">
              <TextInput id="edit-siblings" value={form.siblingsAtSchool} onChange={(e) => set('siblingsAtSchool', e.target.value)} />
            </Field>
            <Field label="Sibling discount tier" htmlFor="edit-sibling-discount">
              <TextInput id="edit-sibling-discount" value={form.siblingDiscountTier} onChange={(e) => set('siblingDiscountTier', e.target.value)} />
            </Field>
            <Field label="Tuition plan" htmlFor="edit-tuition-plan">
              <TextInput id="edit-tuition-plan" value={form.tuitionPlan} onChange={(e) => set('tuitionPlan', e.target.value)} />
            </Field>
            <Field label="Payment status" htmlFor="edit-payment-status">
              <TextInput id="edit-payment-status" value={form.paymentStatus} onChange={(e) => set('paymentStatus', e.target.value)} />
            </Field>
            <Field label="Dietary requirements" htmlFor="edit-dietary">
              <TextInput id="edit-dietary" value={form.dietaryRequirements} onChange={(e) => set('dietaryRequirements', e.target.value)} />
            </Field>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Allergies / medical notes" htmlFor="edit-allergies">
                <TextArea id="edit-allergies" rows={2} value={form.allergiesMedicalNotes} onChange={(e) => set('allergiesMedicalNotes', e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="mt-6 border-t border-sand-line pt-6">
            <h3 className="font-display text-base font-semibold text-ink">Forms & Compliance</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {COMPLIANCE_ITEMS.map((item) => {
                const mapped = COMPLIANCE_FIELD_MAP[item.signedKey];
                return (
                  <div key={item.signedKey} className="flex items-center gap-3 rounded-sm border border-sand-line px-3 py-2">
                    <input
                      id={`edit-${item.signedKey}`}
                      type="checkbox"
                      checked={Boolean(form[mapped.signed])}
                      onChange={(e) => set(mapped.signed, e.target.checked as FormState[typeof mapped.signed])}
                      className="h-4 w-4"
                    />
                    <label htmlFor={`edit-${item.signedKey}`} className="flex-1 text-sm font-semibold text-ink">
                      {item.label}
                    </label>
                    {mapped.date && (
                      <input
                        type="date"
                        value={(form[mapped.date] as string) ?? ''}
                        onChange={(e) => set(mapped.date!, e.target.value as FormState[typeof mapped.date])}
                        className="rounded-sm border border-sand-line px-2 py-1 text-xs"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-sm border border-sand-line px-3 py-2">
                <input
                  id="edit-nisn-signed"
                  type="checkbox"
                  checked={form.nisnRequestSigned}
                  onChange={(e) => set('nisnRequestSigned', e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="edit-nisn-signed" className="text-sm font-semibold text-ink">NISN Request signed</label>
              </div>
              <Field label="NISN number" htmlFor="edit-nisn-number">
                <TextInput id="edit-nisn-number" value={form.nisnNumber} onChange={(e) => set('nisnNumber', e.target.value)} />
              </Field>
              <Field label="Authorized pickup persons" htmlFor="edit-pickup-persons">
                <TextInput id="edit-pickup-persons" value={form.authorizedPickupPersons} onChange={(e) => set('authorizedPickupPersons', e.target.value)} />
              </Field>
              <Field label="Google Classroom email" htmlFor="edit-classroom-email">
                <TextInput
                  id="edit-classroom-email"
                  type="email"
                  value={form.classroomStudentEmail}
                  onChange={(e) => set('classroomStudentEmail', e.target.value)}
                  placeholder="Email used for this child in Google Classroom"
                />
              </Field>
            </div>
          </div>

          <div className="mt-6 border-t border-sand-line pt-6">
            <h3 className="font-display text-base font-semibold text-ink">Immigration Documents</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Visa status" htmlFor="edit-visa-status">
                <TextInput id="edit-visa-status" value={form.visaStatus} onChange={(e) => set('visaStatus', e.target.value)} placeholder="e.g. Social Visa, active until ..." />
              </Field>
              <Field label="Passport copy" htmlFor="edit-passport-copy">
                <DocumentUploadField
                  currentUrl={form.passportCopyUrl}
                  pathPrefix={`children/${child.id}/passport`}
                  label="Passport"
                  uploadEndpoint="/api/admin/children/upload"
                  onUploaded={(url) => uploadDocument('passportCopyUrl', url)}
                />
              </Field>
              <Field label="KITAS copy" htmlFor="edit-kitas-copy">
                <DocumentUploadField
                  currentUrl={form.kitasCopyUrl}
                  pathPrefix={`children/${child.id}/kitas`}
                  label="KITAS"
                  uploadEndpoint="/api/admin/children/upload"
                  onUploaded={(url) => uploadDocument('kitasCopyUrl', url)}
                />
              </Field>
            </div>
          </div>

          {error && <p role="alert" className="mt-4 font-semibold text-orange-deep">{error}</p>}
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setForm(toFormState(child));
                setEditing(false);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
