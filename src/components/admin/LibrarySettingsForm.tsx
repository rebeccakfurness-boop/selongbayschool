'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';

export interface LibrarySettingsValues {
  monthly_membership_fee_idr: number;
  default_loan_period_days: number;
  late_fee_per_day_idr: number;
  late_fee_cap_idr: number | null;
  invoice_due_days: number;
}

export default function LibrarySettingsForm({ initial }: { initial: LibrarySettingsValues }) {
  const router = useRouter();
  const [form, setForm] = useState({
    monthlyMembershipFeeIdr: String(initial.monthly_membership_fee_idr),
    defaultLoanPeriodDays: String(initial.default_loan_period_days),
    lateFeePerDayIdr: String(initial.late_fee_per_day_idr),
    lateFeeCapIdr: initial.late_fee_cap_idr != null ? String(initial.late_fee_cap_idr) : '',
    invoiceDueDays: String(initial.invoice_due_days),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/admin/library/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyMembershipFeeIdr: Number(form.monthlyMembershipFeeIdr),
          defaultLoanPeriodDays: Number(form.defaultLoanPeriodDays),
          lateFeePerDayIdr: Number(form.lateFeePerDayIdr),
          lateFeeCapIdr: form.lateFeeCapIdr ? Number(form.lateFeeCapIdr) : null,
          invoiceDueDays: Number(form.invoiceDueDays),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold text-ink">Library</h2>
      <p className="mt-1 text-xs text-ink-soft">
        Default pricing for new memberships (existing members keep whatever fee they joined at) and how loans and late fees work.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Monthly membership fee (IDR)" htmlFor="lib-fee">
          <TextInput id="lib-fee" type="number" min={0} value={form.monthlyMembershipFeeIdr} onChange={(e) => set('monthlyMembershipFeeIdr', e.target.value)} />
        </Field>
        <Field label="Default loan period (days)" htmlFor="lib-loan-days">
          <TextInput id="lib-loan-days" type="number" min={1} value={form.defaultLoanPeriodDays} onChange={(e) => set('defaultLoanPeriodDays', e.target.value)} />
        </Field>
        <Field label="Late fee per day (IDR)" htmlFor="lib-late-fee">
          <TextInput id="lib-late-fee" type="number" min={0} value={form.lateFeePerDayIdr} onChange={(e) => set('lateFeePerDayIdr', e.target.value)} />
        </Field>
        <Field label="Late fee cap (IDR, optional)" htmlFor="lib-late-cap">
          <TextInput id="lib-late-cap" type="number" min={0} value={form.lateFeeCapIdr} onChange={(e) => set('lateFeeCapIdr', e.target.value)} placeholder="No cap" />
        </Field>
        <Field label="Invoice due days" htmlFor="lib-due-days">
          <TextInput id="lib-due-days" type="number" min={0} value={form.invoiceDueDays} onChange={(e) => set('invoiceDueDays', e.target.value)} />
        </Field>
      </div>
      {error && <p role="alert" className="mt-4 font-semibold text-orange-deep">{error}</p>}
      {success && <p className="mt-4 rounded-md border border-teal/30 bg-aqua/50 px-4 py-3 text-sm font-semibold text-teal-deep">Settings saved.</p>}
      <div className="mt-4">
        <Button type="button" variant="primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </div>
  );
}
