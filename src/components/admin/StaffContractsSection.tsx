'use client';

import { useEffect, useRef, useState } from 'react';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import DocumentUploadField from '@/components/DocumentUploadField';
import SignaturePad, { type SignaturePadHandle } from '@/components/SignaturePad';
import { formatDate } from '@/lib/admin-format';

const UPLOAD_ENDPOINT = '/api/admin/staff/upload';

interface Contract {
  id: number;
  title: string;
  source: 'generated' | 'uploaded';
  status: 'draft' | 'sent' | 'signed' | 'uploaded';
  locked: boolean;
  sent_at: string | null;
  signed_at: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<Contract['status'], string> = {
  draft: 'Draft',
  sent: 'Awaiting signature',
  signed: 'Signed',
  uploaded: 'On file (uploaded)',
};
const STATUS_BADGE: Record<Contract['status'], string> = {
  draft: 'bg-ink/10 text-ink-soft',
  sent: 'bg-orange/20 text-orange-deep',
  signed: 'bg-teal/15 text-teal-deep',
  uploaded: 'bg-teal/15 text-teal-deep',
};

const emptyForm = {
  title: '',
  positionTitle: '',
  roleSummary: '',
  targetGroup: '',
  workDays: '',
  workingHoursPerDay: '8 hours',
  salaryIdr: '',
  termEndDate: '',
  ktpNumber: '',
  employeeAddress: '',
  signedPlace: 'Serangan – Central Lombok, NTB',
  additionalTerms: '',
};

/** Admin generates (or uploads an already-executed) contract for a staff member; the owning
 * staff member reviews and signs it in-portal with SignaturePad -- once signed (or once an
 * admin-uploaded copy is on file), opening it again requires the shared access code, checked
 * server-side (see the download route's own comment for why that's the realistic guarantee here,
 * not a real PDF-embedded password). Mirrors StaffPayslipsSection's generate/list/gated-open
 * shape throughout. */
export default function StaffContractsSection({
  adminUserId,
  canEdit,
  isSelf,
}: {
  adminUserId: number;
  canEdit: boolean;
  isSelf: boolean;
}) {
  const [contracts, setContracts] = useState<Contract[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [generating, setGenerating] = useState<'draft' | 'send' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [savingUpload, setSavingUpload] = useState(false);

  const [sendingId, setSendingId] = useState<number | null>(null);

  const [pinPromptFor, setPinPromptFor] = useState<number | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [opening, setOpening] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const [signingId, setSigningId] = useState<number | null>(null);
  const [signedByName, setSignedByName] = useState('');
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const padRef = useRef<SignaturePadHandle>(null);

  async function load() {
    const res = await fetch(`/api/admin/staff/${adminUserId}/contracts`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) setContracts(data.contracts);
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/staff/${adminUserId}/contracts`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled || !ok) return;
        setContracts(data.contracts);
      });
    return () => {
      cancelled = true;
    };
  }, [adminUserId]);

  const canGenerate = form.title.trim() && form.positionTitle.trim() && form.termEndDate && form.salaryIdr !== '';

  async function generate(send: boolean) {
    if (!canGenerate) return;
    setGenerating(send ? 'send' : 'draft');
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff/${adminUserId}/contracts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, send }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not create that contract.');
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create that contract.');
    } finally {
      setGenerating(null);
    }
  }

  async function sendDraft(id: number) {
    setSendingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff/${adminUserId}/contracts/${id}/send`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send that contract.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send that contract.');
    } finally {
      setSendingId(null);
    }
  }

  async function saveUpload() {
    if (!uploadTitle.trim() || !uploadUrl) return;
    setSavingUpload(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff/${adminUserId}/contracts/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: uploadTitle.trim(), fileUrl: uploadUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save that contract.');
      setUploadTitle('');
      setUploadUrl(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that contract.');
    } finally {
      setSavingUpload(false);
    }
  }

  async function remove(id: number) {
    await fetch(`/api/admin/staff/${adminUserId}/contracts/${id}`, { method: 'DELETE' });
    await load();
  }

  async function openAsAdmin(id: number) {
    const res = await fetch(`/api/admin/staff/${adminUserId}/contracts/${id}/download`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) window.open(data.url, '_blank', 'noopener,noreferrer');
    else setError(data.error || 'Could not open this contract.');
  }

  async function openUnlocked(id: number) {
    // Not-yet-locked (draft or sent) contract -- the owner can always read it, no code needed.
    const res = await fetch(`/api/admin/staff/${adminUserId}/contracts/${id}/download`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) window.open(data.url, '_blank', 'noopener,noreferrer');
    else setError(data.error || 'Could not open this contract.');
  }

  async function confirmPin() {
    if (!pinPromptFor) return;
    setOpening(true);
    setPinError(null);
    try {
      const res = await fetch(`/api/admin/staff/${adminUserId}/contracts/${pinPromptFor}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not open this contract.');
      window.open(data.url, '_blank', 'noopener,noreferrer');
      setPinPromptFor(null);
      setPinInput('');
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Could not open this contract.');
    } finally {
      setOpening(false);
    }
  }

  async function submitSignature() {
    if (!signingId || !padRef.current || padRef.current.isEmpty() || !signedByName.trim()) return;
    setSigning(true);
    setSignError(null);
    try {
      const res = await fetch(`/api/admin/staff/${adminUserId}/contracts/${signingId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedByName: signedByName.trim(), signatureDataUrl: padRef.current.toDataUrl() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save your signature.');
      setSigningId(null);
      setSignedByName('');
      padRef.current.clear();
      await load();
    } catch (err) {
      setSignError(err instanceof Error ? err.message : 'Could not save your signature.');
    } finally {
      setSigning(false);
    }
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold text-ink">Contracts</h2>
      {isSelf && !canEdit && (
        <p className="mt-1 text-xs text-ink-soft">Once a contract is signed, you&apos;ll need the access code to open it again -- that&apos;s what keeps it private.</p>
      )}

      {canEdit && (
        <div className="mt-3 flex flex-col gap-4 rounded-sm border border-dashed border-sand-line p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Create a contract</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title" htmlFor="ct-title" required>
              <TextInput id="ct-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Fixed-Term Employment Agreement 2027" />
            </Field>
            <Field label="Position" htmlFor="ct-position" required>
              <TextInput id="ct-position" value={form.positionTitle} onChange={(e) => setForm((f) => ({ ...f, positionTitle: e.target.value }))} placeholder="e.g. Specialist Science & Technology Teacher" />
            </Field>
            <Field label="Target group" htmlFor="ct-target">
              <TextInput id="ct-target" value={form.targetGroup} onChange={(e) => setForm((f) => ({ ...f, targetGroup: e.target.value }))} placeholder="e.g. Kindergarten, Primary and Secondary" />
            </Field>
            <Field label="Work days" htmlFor="ct-days">
              <TextInput id="ct-days" value={form.workDays} onChange={(e) => setForm((f) => ({ ...f, workDays: e.target.value }))} placeholder="e.g. Monday to Friday" />
            </Field>
            <Field label="Working hours per day" htmlFor="ct-hours">
              <TextInput id="ct-hours" value={form.workingHoursPerDay} onChange={(e) => setForm((f) => ({ ...f, workingHoursPerDay: e.target.value }))} />
            </Field>
            <Field label="Salary (IDR / month)" htmlFor="ct-salary" required>
              <TextInput id="ct-salary" type="number" min={0} value={form.salaryIdr} onChange={(e) => setForm((f) => ({ ...f, salaryIdr: e.target.value }))} placeholder="0" />
            </Field>
            <Field label="Agreement valid until" htmlFor="ct-end" required>
              <TextInput id="ct-end" type="date" value={form.termEndDate} onChange={(e) => setForm((f) => ({ ...f, termEndDate: e.target.value }))} />
            </Field>
            <Field label="KTP / ID number" htmlFor="ct-ktp">
              <TextInput id="ct-ktp" value={form.ktpNumber} onChange={(e) => setForm((f) => ({ ...f, ktpNumber: e.target.value }))} />
            </Field>
            <Field label="Residential address" htmlFor="ct-address">
              <TextInput id="ct-address" value={form.employeeAddress} onChange={(e) => setForm((f) => ({ ...f, employeeAddress: e.target.value }))} />
            </Field>
            <Field label="Signed in (place)" htmlFor="ct-place">
              <TextInput id="ct-place" value={form.signedPlace} onChange={(e) => setForm((f) => ({ ...f, signedPlace: e.target.value }))} />
            </Field>
          </div>
          <Field label="Duties and responsibilities" htmlFor="ct-role">
            <TextArea id="ct-role" rows={4} value={form.roleSummary} onChange={(e) => setForm((f) => ({ ...f, roleSummary: e.target.value }))} placeholder="Describe the role's duties -- this goes into Article 2 of the agreement." />
          </Field>
          <Field label="Additional terms (optional)" htmlFor="ct-extra">
            <TextArea id="ct-extra" rows={2} value={form.additionalTerms} onChange={(e) => setForm((f) => ({ ...f, additionalTerms: e.target.value }))} placeholder="Anything specific to this hire, added as its own article." />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="primary" onClick={() => generate(true)} disabled={generating !== null || !canGenerate}>
              {generating === 'send' ? 'Sending…' : 'Send to staff for signing'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => generate(false)} disabled={generating !== null || !canGenerate}>
              {generating === 'draft' ? 'Saving…' : 'Save as draft'}
            </Button>
          </div>

          <div className="mt-2 border-t border-sand-line pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Or upload an already-signed copy</p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <Field label="Title" htmlFor="ct-upload-title">
                <TextInput id="ct-upload-title" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="e.g. Signed contract 2027" />
              </Field>
              <DocumentUploadField
                currentUrl={uploadUrl}
                pathPrefix={`staff/${adminUserId}/contracts`}
                label="signed contract"
                uploadEndpoint={UPLOAD_ENDPOINT}
                onUploaded={(url) => setUploadUrl(url)}
              />
              <Button type="button" variant="ghost" onClick={saveUpload} disabled={savingUpload || !uploadTitle.trim() || !uploadUrl}>
                {savingUpload ? 'Saving…' : 'Save to staff file'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}

      <ul className="mt-4 flex flex-col gap-2">
        {contracts?.map((c) => (
          <li key={c.id} className="flex flex-col gap-2 rounded-sm border border-sand-line p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-ink">{c.title}</p>
                <p className="text-xs text-ink-soft">
                  {c.signed_at ? `Signed ${formatDate(c.signed_at.slice(0, 10))}` : c.sent_at ? `Sent ${formatDate(c.sent_at.slice(0, 10))}` : `Created ${formatDate(c.created_at.slice(0, 10))}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_BADGE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                {canEdit ? (
                  <button type="button" onClick={() => openAsAdmin(c.id)} className="text-xs font-semibold text-teal-deep hover:underline">View</button>
                ) : c.locked ? (
                  <button type="button" onClick={() => { setPinPromptFor(c.id); setPinError(null); }} className="text-xs font-semibold text-teal-deep hover:underline">View</button>
                ) : (
                  <button type="button" onClick={() => openUnlocked(c.id)} className="text-xs font-semibold text-teal-deep hover:underline">Review</button>
                )}
                {!canEdit && isSelf && c.status === 'sent' && (
                  <button type="button" onClick={() => { setSigningId(c.id); setSignError(null); setSignedByName(''); }} className="text-xs font-semibold text-orange-deep hover:underline">
                    Sign
                  </button>
                )}
                {canEdit && c.status === 'draft' && (
                  <button type="button" onClick={() => sendDraft(c.id)} disabled={sendingId === c.id} className="text-xs font-semibold text-teal-deep hover:underline disabled:opacity-40">
                    {sendingId === c.id ? 'Sending…' : 'Send to staff'}
                  </button>
                )}
                {canEdit && (
                  <button type="button" onClick={() => remove(c.id)} className="text-xs font-semibold text-orange-deep hover:underline">Remove</button>
                )}
              </div>
            </div>

            {signingId === c.id && (
              <div className="mt-2 rounded-md border-2 border-orange/40 bg-orange/5 p-4">
                <p className="text-sm font-semibold text-ink">Review the contract above, then sign below to accept it.</p>
                <div className="mt-3">
                  <Field label="Type your full name" htmlFor={`sign-name-${c.id}`} required>
                    <TextInput id={`sign-name-${c.id}`} value={signedByName} onChange={(e) => setSignedByName(e.target.value)} placeholder="Full name" />
                  </Field>
                </div>
                <div className="mt-3">
                  <SignaturePad ref={padRef} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button type="button" variant="primary" onClick={submitSignature} disabled={signing || !signedByName.trim()}>
                    {signing ? 'Saving…' : 'Accept & sign'}
                  </Button>
                  <button type="button" onClick={() => padRef.current?.clear()} className="text-xs font-semibold text-ink-soft hover:underline">Clear</button>
                  <button type="button" onClick={() => { setSigningId(null); setSignError(null); }} className="text-xs font-semibold text-ink-soft hover:underline">Cancel</button>
                </div>
                {signError && <p className="mt-2 text-xs font-semibold text-orange-deep">{signError}</p>}
              </div>
            )}
          </li>
        ))}
        {contracts?.length === 0 && <li className="text-sm text-ink-soft">No contracts on file yet.</li>}
        {contracts === null && <li className="text-sm text-ink-soft">Loading…</li>}
      </ul>

      {pinPromptFor !== null && (
        <div className="mt-4 rounded-md border-2 border-teal/40 bg-teal/5 p-4">
          <p className="text-sm font-semibold text-ink">Enter the access code to open this contract.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="password"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-32 rounded-sm border border-sand-line bg-white px-3 py-2 text-sm"
              placeholder="Code"
            />
            <Button type="button" variant="primary" onClick={confirmPin} disabled={opening || !pinInput}>
              {opening ? 'Checking…' : 'Open'}
            </Button>
            <button type="button" onClick={() => { setPinPromptFor(null); setPinInput(''); setPinError(null); }} className="text-xs font-semibold text-ink-soft hover:underline">
              Cancel
            </button>
          </div>
          {pinError && <p className="mt-2 text-xs font-semibold text-orange-deep">{pinError}</p>}
        </div>
      )}
    </div>
  );
}
