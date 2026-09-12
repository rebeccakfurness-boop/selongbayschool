'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import DocumentUploadField from '@/components/DocumentUploadField';
import { EMPLOYMENT_STATUS_LEGEND, BPJS_STATUS_LABELS, type EmploymentStatus } from '@/lib/staff-data';
import { formatDate } from '@/lib/admin-format';
import type { StaffDetail } from '@/lib/staff-hr';
import StaffProfessionalDevelopmentSection from '@/components/admin/StaffProfessionalDevelopmentSection';
import StaffPayslipsSection from '@/components/admin/StaffPayslipsSection';
import StaffLunchSection from '@/components/admin/StaffLunchSection';

const UPLOAD_ENDPOINT = '/api/admin/staff/upload';

const BPJS_OPTIONS = ['active', 'pending', 'inactive', 'not_applicable'] as const;

function toFormState(staff: StaffDetail) {
  return {
    displayName: staff.display_name ?? '',
    positionTitle: staff.position_title ?? '',
    dob: staff.dob ?? '',
    startDate: staff.start_date ?? '',
    endDate: staff.end_date ?? '',
    phone: staff.phone ?? '',
    address: staff.address ?? '',
    nationality: staff.nationality ?? '',
    emergencyContactName: staff.emergency_contact_name ?? '',
    emergencyContactPhone: staff.emergency_contact_phone ?? '',
    cvUrl: staff.cv_url,
    contractUrl: staff.contract_url,
    qualifications: staff.qualifications ?? '',
    visaStatus: staff.visa_status ?? '',
    kitasNumber: staff.kitas_number ?? '',
    kitasExpiry: staff.kitas_expiry ?? '',
    passportCopyUrl: staff.passport_copy_url,
    bpjsKesehatanNumber: staff.bpjs_kesehatan_number ?? '',
    bpjsKesehatanStatus: staff.bpjs_kesehatan_status ?? '',
    bpjsKetenagakerjaanNumber: staff.bpjs_ketenagakerjaan_number ?? '',
    bpjsKetenagakerjaanStatus: staff.bpjs_ketenagakerjaan_status ?? '',
    bankName: staff.bank_name ?? '',
    bankAccountNumber: staff.bank_account_number ?? '',
    bankAccountName: staff.bank_account_name ?? '',
    hrNotes: staff.hr_notes ?? '',
  };
}
type FormState = ReturnType<typeof toFormState>;

export default function StaffCard({
  staff,
  canEdit,
  isSelf,
}: {
  staff: StaffDetail;
  canEdit: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => toFormState(staff));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff/${staff.id}/hr`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          dob: form.dob || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          kitasExpiry: form.kitasExpiry || null,
          bpjsKesehatanStatus: form.bpjsKesehatanStatus || null,
          bpjsKetenagakerjaanStatus: form.bpjsKetenagakerjaanStatus || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save changes.');
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  const statusLegend = EMPLOYMENT_STATUS_LEGEND[staff.employment_status as EmploymentStatus];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{staff.display_name || staff.email}</h1>
            <p className="text-sm text-ink-soft">{staff.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusLegend.badgeClass}`}>{statusLegend.label}</span>
              {!staff.is_active && <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-bold text-ink-soft">Login disabled</span>}
              {staff.position_title && <span className="text-xs text-ink-soft">{staff.position_title}</span>}
            </div>
            {staff.assigned_classes.length > 0 && (
              <p className="mt-1 text-xs text-ink-soft">Assigned classes: {staff.assigned_classes.join(', ')}</p>
            )}
          </div>
          {canEdit && (
            <button type="button" onClick={() => (editing ? setEditing(false) : setEditing(true))} className="text-sm font-semibold text-teal-deep hover:underline">
              {editing ? 'Cancel' : 'Edit'}
            </button>
          )}
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-orange-deep">{error}</p>}

        {editing ? (
          <div className="mt-6 flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Display name" htmlFor="staff-display-name">
                <TextInput id="staff-display-name" value={form.displayName} onChange={(e) => set('displayName', e.target.value)} />
              </Field>
              <Field label="Position title" htmlFor="staff-position">
                <TextInput id="staff-position" value={form.positionTitle} onChange={(e) => set('positionTitle', e.target.value)} placeholder="e.g. Year 3 Teacher" />
              </Field>
              <Field label="Date of birth" htmlFor="staff-dob">
                <TextInput id="staff-dob" type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} />
              </Field>
              <Field label="Phone" htmlFor="staff-phone">
                <TextInput id="staff-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </Field>
              <Field label="Nationality" htmlFor="staff-nationality">
                <TextInput id="staff-nationality" value={form.nationality} onChange={(e) => set('nationality', e.target.value)} />
              </Field>
              <Field label="Start date" htmlFor="staff-start">
                <TextInput id="staff-start" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
              </Field>
              <Field label="End date" htmlFor="staff-end">
                <TextInput id="staff-end" type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
              </Field>
            </div>

            <Field label="Address" htmlFor="staff-address">
              <TextArea id="staff-address" rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Emergency contact name" htmlFor="staff-ec-name">
                <TextInput id="staff-ec-name" value={form.emergencyContactName} onChange={(e) => set('emergencyContactName', e.target.value)} />
              </Field>
              <Field label="Emergency contact phone" htmlFor="staff-ec-phone">
                <TextInput id="staff-ec-phone" value={form.emergencyContactPhone} onChange={(e) => set('emergencyContactPhone', e.target.value)} />
              </Field>
            </div>

            <Field label="Qualifications" htmlFor="staff-quals">
              <TextArea id="staff-quals" rows={2} value={form.qualifications} onChange={(e) => set('qualifications', e.target.value)} placeholder="e.g. B.Ed, PGCE" />
            </Field>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">CV</p>
              <div className="mt-1">
                <DocumentUploadField
                  currentUrl={form.cvUrl}
                  pathPrefix={`staff/${staff.id}/cv`}
                  label="CV"
                  uploadEndpoint={UPLOAD_ENDPOINT}
                  onUploaded={(url) => set('cvUrl', url)}
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Contract</p>
              <div className="mt-1">
                <DocumentUploadField
                  currentUrl={form.contractUrl}
                  pathPrefix={`staff/${staff.id}/contract`}
                  label="contract"
                  uploadEndpoint={UPLOAD_ENDPOINT}
                  onUploaded={(url) => set('contractUrl', url)}
                />
              </div>
            </div>

            <div className="rounded-md border border-dashed border-sand-line p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Visa &amp; immigration</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Visa status" htmlFor="staff-visa">
                  <TextInput id="staff-visa" value={form.visaStatus} onChange={(e) => set('visaStatus', e.target.value)} placeholder="e.g. KITAS sponsored" />
                </Field>
                <Field label="KITAS number" htmlFor="staff-kitas">
                  <TextInput id="staff-kitas" value={form.kitasNumber} onChange={(e) => set('kitasNumber', e.target.value)} />
                </Field>
                <Field label="KITAS expiry" htmlFor="staff-kitas-expiry">
                  <TextInput id="staff-kitas-expiry" type="date" value={form.kitasExpiry} onChange={(e) => set('kitasExpiry', e.target.value)} />
                </Field>
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Passport copy</p>
                <div className="mt-1">
                  <DocumentUploadField
                    currentUrl={form.passportCopyUrl}
                    pathPrefix={`staff/${staff.id}/passport`}
                    label="passport copy"
                    uploadEndpoint={UPLOAD_ENDPOINT}
                    onUploaded={(url) => set('passportCopyUrl', url)}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-md border border-dashed border-sand-line p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">BPJS (Indonesian social security)</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="BPJS Kesehatan number" htmlFor="staff-bpjs-k-number">
                  <TextInput id="staff-bpjs-k-number" value={form.bpjsKesehatanNumber} onChange={(e) => set('bpjsKesehatanNumber', e.target.value)} />
                </Field>
                <Field label="BPJS Kesehatan status" htmlFor="staff-bpjs-k-status">
                  <select
                    id="staff-bpjs-k-status"
                    value={form.bpjsKesehatanStatus}
                    onChange={(e) => set('bpjsKesehatanStatus', e.target.value)}
                    className="w-full rounded-sm border border-sand-line bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Not set</option>
                    {BPJS_OPTIONS.map((o) => (
                      <option key={o} value={o}>{BPJS_STATUS_LABELS[o]}</option>
                    ))}
                  </select>
                </Field>
                <Field label="BPJS Ketenagakerjaan number" htmlFor="staff-bpjs-t-number">
                  <TextInput id="staff-bpjs-t-number" value={form.bpjsKetenagakerjaanNumber} onChange={(e) => set('bpjsKetenagakerjaanNumber', e.target.value)} />
                </Field>
                <Field label="BPJS Ketenagakerjaan status" htmlFor="staff-bpjs-t-status">
                  <select
                    id="staff-bpjs-t-status"
                    value={form.bpjsKetenagakerjaanStatus}
                    onChange={(e) => set('bpjsKetenagakerjaanStatus', e.target.value)}
                    className="w-full rounded-sm border border-sand-line bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Not set</option>
                    {BPJS_OPTIONS.map((o) => (
                      <option key={o} value={o}>{BPJS_STATUS_LABELS[o]}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            <div className="rounded-md border border-dashed border-sand-line p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Bank details (payroll)</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <Field label="Bank name" htmlFor="staff-bank-name">
                  <TextInput id="staff-bank-name" value={form.bankName} onChange={(e) => set('bankName', e.target.value)} />
                </Field>
                <Field label="Account number" htmlFor="staff-bank-account">
                  <TextInput id="staff-bank-account" value={form.bankAccountNumber} onChange={(e) => set('bankAccountNumber', e.target.value)} />
                </Field>
                <Field label="Account name" htmlFor="staff-bank-account-name">
                  <TextInput id="staff-bank-account-name" value={form.bankAccountName} onChange={(e) => set('bankAccountName', e.target.value)} />
                </Field>
              </div>
            </div>

            <Field label="HR notes" htmlFor="staff-hr-notes">
              <TextArea id="staff-hr-notes" rows={3} value={form.hrNotes} onChange={(e) => set('hrNotes', e.target.value)} placeholder="Admin-only notes" />
            </Field>

            <div>
              <Button type="button" variant="primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <InfoBlock title="Personal">
              <InfoRow label="Date of birth" value={staff.dob ? formatDate(staff.dob) : null} />
              <InfoRow label="Phone" value={staff.phone} />
              <InfoRow label="Nationality" value={staff.nationality} />
              <InfoRow label="Address" value={staff.address} />
              <InfoRow label="Emergency contact" value={staff.emergency_contact_name ? `${staff.emergency_contact_name} · ${staff.emergency_contact_phone ?? ''}` : null} />
            </InfoBlock>
            <InfoBlock title="Employment">
              <InfoRow label="Start date" value={staff.start_date ? formatDate(staff.start_date) : null} />
              <InfoRow label="End date" value={staff.end_date ? formatDate(staff.end_date) : null} />
              <InfoRow label="Qualifications" value={staff.qualifications} />
              <InfoRow label="CV" value={staff.cv_url ? 'On file' : null} link={staff.cv_url} />
              <InfoRow label="Contract" value={staff.contract_url ? 'On file' : null} link={staff.contract_url} />
            </InfoBlock>
            <InfoBlock title="Visa & immigration">
              <InfoRow label="Visa status" value={staff.visa_status} />
              <InfoRow label="KITAS number" value={staff.kitas_number} />
              <InfoRow label="KITAS expiry" value={staff.kitas_expiry ? formatDate(staff.kitas_expiry) : null} />
              <InfoRow label="Passport copy" value={staff.passport_copy_url ? 'On file' : null} link={staff.passport_copy_url} />
            </InfoBlock>
            <InfoBlock title="BPJS">
              <InfoRow label="Kesehatan" value={staff.bpjs_kesehatan_number ? `${staff.bpjs_kesehatan_number} · ${BPJS_STATUS_LABELS[staff.bpjs_kesehatan_status ?? ''] ?? 'Not set'}` : null} />
              <InfoRow label="Ketenagakerjaan" value={staff.bpjs_ketenagakerjaan_number ? `${staff.bpjs_ketenagakerjaan_number} · ${BPJS_STATUS_LABELS[staff.bpjs_ketenagakerjaan_status ?? ''] ?? 'Not set'}` : null} />
            </InfoBlock>
            {canEdit && (
              <InfoBlock title="Bank details">
                <InfoRow label="Bank" value={staff.bank_name} />
                <InfoRow label="Account number" value={staff.bank_account_number} />
                <InfoRow label="Account name" value={staff.bank_account_name} />
              </InfoBlock>
            )}
            {canEdit && staff.hr_notes && (
              <InfoBlock title="HR notes">
                <p className="whitespace-pre-line text-sm text-ink-soft">{staff.hr_notes}</p>
              </InfoBlock>
            )}
          </div>
        )}
      </div>

      <StaffProfessionalDevelopmentSection adminUserId={staff.id} canEdit={canEdit} />
      <StaffLunchSection adminUserId={staff.id} />
      <StaffPayslipsSection adminUserId={staff.id} canEdit={canEdit} isSelf={isSelf} staffDobOnFile={!!staff.dob} />
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-sand-line bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{title}</p>
      <div className="mt-2 flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, link }: { label: string; value: string | null | undefined; link?: string | null }) {
  if (!value) return null;
  return (
    <p className="text-sm text-ink">
      <span className="text-ink-soft">{label}: </span>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
          {value}
        </a>
      ) : (
        <span className="font-semibold">{value}</span>
      )}
    </p>
  );
}
