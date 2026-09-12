'use client';

import { useEffect, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { TextInput } from '@/components/forms/FormField';
import Button from '@/components/Button';
import { formatDate } from '@/lib/admin-format';

interface Payslip {
  id: number;
  period_label: string;
  uploaded_at: string;
}

/** Admin uploads a payslip PDF per period; the owning staff member (or an admin) can open one --
 * an admin skips straight through, but the owning staff member must type their own date of birth
 * first, checked server-side against admin_users.dob (see the download route's own comment for why
 * this is an application-level gate rather than a PDF-embedded password). */
export default function StaffPayslipsSection({
  adminUserId,
  canEdit,
  isSelf,
  staffDobOnFile,
}: {
  adminUserId: number;
  canEdit: boolean;
  isSelf: boolean;
  staffDobOnFile: boolean;
}) {
  const [payslips, setPayslips] = useState<Payslip[] | null>(null);
  const [periodLabel, setPeriodLabel] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dobPromptFor, setDobPromptFor] = useState<number | null>(null);
  const [dobInput, setDobInput] = useState('');
  const [opening, setOpening] = useState(false);
  const [dobError, setDobError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/admin/staff/${adminUserId}/payslips`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) setPayslips(data.payslips);
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/staff/${adminUserId}/payslips`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled || !ok) return;
        setPayslips(data.payslips);
      });
    return () => {
      cancelled = true;
    };
  }, [adminUserId]);

  async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !periodLabel.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await upload(`staff/${adminUserId}/payslips/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/staff/upload',
      });
      const res = await fetch(`/api/admin/staff/${adminUserId}/payslips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodLabel: periodLabel.trim(), fileUrl: blob.url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not add that payslip.');
      setPeriodLabel('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload that payslip.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function remove(id: number) {
    await fetch(`/api/admin/staff/${adminUserId}/payslips/${id}`, { method: 'DELETE' });
    await load();
  }

  async function openAsAdmin(id: number) {
    const res = await fetch(`/api/admin/staff/${adminUserId}/payslips/${id}/download`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) window.open(data.url, '_blank', 'noopener,noreferrer');
  }

  async function confirmDob() {
    if (!dobPromptFor) return;
    setOpening(true);
    setDobError(null);
    try {
      const res = await fetch(`/api/admin/staff/${adminUserId}/payslips/${dobPromptFor}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dob: dobInput }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not open this payslip.');
      window.open(data.url, '_blank', 'noopener,noreferrer');
      setDobPromptFor(null);
      setDobInput('');
    } catch (err) {
      setDobError(err instanceof Error ? err.message : 'Could not open this payslip.');
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold text-ink">Payslips</h2>
      {isSelf && !canEdit && (
        <p className="mt-1 text-xs text-ink-soft">You&apos;ll be asked for your date of birth to open one -- that&apos;s what keeps them private to you.</p>
      )}

      {canEdit && (
        <div className="mt-3 flex flex-wrap items-end gap-3 rounded-sm border border-dashed border-sand-line p-3">
          <TextInput value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} placeholder="e.g. January 2027" className="max-w-xs" />
          <label className={`cursor-pointer text-sm font-semibold ${periodLabel.trim() ? 'text-teal-deep hover:underline' : 'text-ink-soft'}`}>
            {uploading ? 'Uploading…' : 'Upload payslip PDF'}
            <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={handleUploadFile} disabled={uploading || !periodLabel.trim()} className="hidden" />
          </label>
        </div>
      )}
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}

      <ul className="mt-4 flex flex-col gap-2">
        {payslips?.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 rounded-sm border border-sand-line p-3 text-sm">
            <div>
              <p className="font-semibold text-ink">{p.period_label}</p>
              <p className="text-xs text-ink-soft">Uploaded {formatDate(p.uploaded_at.slice(0, 10))}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => (canEdit ? openAsAdmin(p.id) : setDobPromptFor(p.id))}
                className="text-xs font-semibold text-teal-deep hover:underline"
              >
                View
              </button>
              {canEdit && (
                <button type="button" onClick={() => remove(p.id)} className="text-xs font-semibold text-orange-deep hover:underline">
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
        {payslips?.length === 0 && <li className="text-sm text-ink-soft">No payslips uploaded yet.</li>}
        {payslips === null && <li className="text-sm text-ink-soft">Loading…</li>}
      </ul>

      {dobPromptFor !== null && (
        <div className="mt-4 rounded-md border-2 border-teal/40 bg-teal/5 p-4">
          <p className="text-sm font-semibold text-ink">Enter your date of birth to open this payslip.</p>
          {!staffDobOnFile && <p className="mt-1 text-xs text-orange-deep">No date of birth is on file for you yet — ask an admin to add it.</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input type="date" value={dobInput} onChange={(e) => setDobInput(e.target.value)} className="rounded-sm border border-sand-line bg-white px-3 py-2 text-sm" />
            <Button type="button" variant="primary" onClick={confirmDob} disabled={opening || !dobInput}>
              {opening ? 'Checking…' : 'Open'}
            </Button>
            <button type="button" onClick={() => { setDobPromptFor(null); setDobInput(''); setDobError(null); }} className="text-xs font-semibold text-ink-soft hover:underline">
              Cancel
            </button>
          </div>
          {dobError && <p className="mt-2 text-xs font-semibold text-orange-deep">{dobError}</p>}
        </div>
      )}
    </div>
  );
}
