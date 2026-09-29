'use client';

import { useEffect, useState } from 'react';
import { Field, TextInput } from '@/components/forms/FormField';
import Button from '@/components/Button';
import { formatDate } from '@/lib/admin-format';

interface Payslip {
  id: number;
  period_label: string;
  uploaded_at: string;
  gross_salary: string | null;
  take_home_pay: string | null;
}

function formatIDR(value: string | null): string | null {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(n))}`;
}

const emptyForm = {
  periodLabel: '',
  periodStart: '',
  periodEnd: '',
  basicSalary: '',
  housingAllowance: '',
  pph21Deduction: '',
  loanDeduction: '',
  jkkRatePercent: '0.24',
};

/** Admin generates a payslip PDF per period from entered/computed payroll figures; the owning
 * staff member (or an admin) can open one -- an admin skips straight through, but the owning
 * staff member must type their own date of birth first, checked server-side against
 * admin_users.dob (see the download route's own comment for why this is an application-level
 * gate rather than a PDF-embedded password). */
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
  const [form, setForm] = useState(emptyForm);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dobPromptFor, setDobPromptFor] = useState<number | null>(null);
  const [dobInput, setDobInput] = useState('');
  const [opening, setOpening] = useState(false);
  const [dobError, setDobError] = useState<string | null>(null);

  const [sendingId, setSendingId] = useState<number | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

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

  const canGenerate = form.periodLabel.trim() && form.periodStart && form.periodEnd && form.basicSalary !== '';

  async function generate() {
    if (!canGenerate) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff/${adminUserId}/payslips/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodLabel: form.periodLabel.trim(),
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          basicSalary: form.basicSalary,
          housingAllowance: form.housingAllowance || 0,
          pph21Deduction: form.pph21Deduction || 0,
          loanDeduction: form.loanDeduction || 0,
          jkkRatePercent: form.jkkRatePercent || 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not generate that payslip.');
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate that payslip.');
    } finally {
      setGenerating(false);
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

  async function emailPayslip(id: number) {
    setSendingId(id);
    setSentMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff/${adminUserId}/payslips/${id}/send`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send that payslip.');
      setSentMessage(`Sent to ${data.email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send that payslip.');
    } finally {
      setSendingId(null);
    }
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
        <div className="mt-3 rounded-sm border border-dashed border-sand-line p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Period" htmlFor="ps-period" required>
              <TextInput id="ps-period" value={form.periodLabel} onChange={(e) => setForm((f) => ({ ...f, periodLabel: e.target.value }))} placeholder="e.g. January 2027" />
            </Field>
            <Field label="Period start" htmlFor="ps-start" required>
              <TextInput id="ps-start" type="date" value={form.periodStart} onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))} />
            </Field>
            <Field label="Period end" htmlFor="ps-end" required>
              <TextInput id="ps-end" type="date" value={form.periodEnd} onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))} />
            </Field>
            <Field label="Basic salary (IDR)" htmlFor="ps-basic" required>
              <TextInput id="ps-basic" type="number" min={0} value={form.basicSalary} onChange={(e) => setForm((f) => ({ ...f, basicSalary: e.target.value }))} placeholder="0" />
            </Field>
            <Field label="Housing allowance (IDR)" htmlFor="ps-housing">
              <TextInput id="ps-housing" type="number" min={0} value={form.housingAllowance} onChange={(e) => setForm((f) => ({ ...f, housingAllowance: e.target.value }))} placeholder="0" />
            </Field>
            <Field label="PPh 21 deduction (IDR)" htmlFor="ps-pph21">
              <TextInput id="ps-pph21" type="number" min={0} value={form.pph21Deduction} onChange={(e) => setForm((f) => ({ ...f, pph21Deduction: e.target.value }))} placeholder="0" />
            </Field>
            <Field label="Loan / cashbon deduction (IDR)" htmlFor="ps-loan">
              <TextInput id="ps-loan" type="number" min={0} value={form.loanDeduction} onChange={(e) => setForm((f) => ({ ...f, loanDeduction: e.target.value }))} placeholder="0" />
            </Field>
            <Field label="JKK rate (%)" htmlFor="ps-jkk">
              <TextInput id="ps-jkk" type="number" min={0} max={10} step={0.01} value={form.jkkRatePercent} onChange={(e) => setForm((f) => ({ ...f, jkkRatePercent: e.target.value }))} />
            </Field>
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            BPJS JHT (2% employee / 3.7% employer) and JP (1% employee / 2% employer) are calculated automatically from Basic Salary only --
            Housing Allowance is added on top of Gross Salary but never factored into any deduction or contribution. Attendance is pulled from
            check-in records for the period above.
          </p>
          <div className="mt-3">
            <Button type="button" variant="primary" onClick={generate} disabled={generating || !canGenerate}>
              {generating ? 'Generating…' : 'Generate payslip'}
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
      {sentMessage && <p className="mt-2 text-xs font-semibold text-teal-deep">{sentMessage}</p>}

      <ul className="mt-4 flex flex-col gap-2">
        {payslips?.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 rounded-sm border border-sand-line p-3 text-sm">
            <div>
              <p className="font-semibold text-ink">{p.period_label}</p>
              <p className="text-xs text-ink-soft">Generated {formatDate(p.uploaded_at.slice(0, 10))}</p>
              {(formatIDR(p.gross_salary) || formatIDR(p.take_home_pay)) && (
                <p className="text-xs text-ink-soft">
                  {formatIDR(p.gross_salary) && <>Gross {formatIDR(p.gross_salary)}</>}
                  {formatIDR(p.gross_salary) && formatIDR(p.take_home_pay) && ' · '}
                  {formatIDR(p.take_home_pay) && <>Take-home {formatIDR(p.take_home_pay)}</>}
                </p>
              )}
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
                <button
                  type="button"
                  onClick={() => emailPayslip(p.id)}
                  disabled={sendingId === p.id}
                  className="text-xs font-semibold text-teal-deep hover:underline disabled:opacity-40"
                >
                  {sendingId === p.id ? 'Sending…' : 'Email to staff member'}
                </button>
              )}
              {canEdit && (
                <button type="button" onClick={() => remove(p.id)} className="text-xs font-semibold text-orange-deep hover:underline">
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
        {payslips?.length === 0 && <li className="text-sm text-ink-soft">No payslips generated yet.</li>}
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
