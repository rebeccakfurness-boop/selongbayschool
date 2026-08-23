'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';

export interface SchoolSettings {
  payable_to: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  swift_code: string;
  bank_address: string | null;
  bank_code: string | null;
  branch_code: string | null;
  clearing_code: string | null;
  currency: string;
  invoice_due_days: number;
}

export default function SchoolSettingsForm({ initial }: { initial: SchoolSettings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    payableTo: initial.payable_to,
    bankName: initial.bank_name,
    accountNumber: initial.account_number,
    accountName: initial.account_name,
    swiftCode: initial.swift_code,
    bankAddress: initial.bank_address ?? '',
    bankCode: initial.bank_code ?? '',
    branchCode: initial.branch_code ?? '',
    clearingCode: initial.clearing_code ?? '',
    currency: initial.currency,
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
      const res = await fetch('/api/admin/school-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, invoiceDueDays: Number(form.invoiceDueDays) }),
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
      <h2 className="font-display text-lg font-semibold text-ink">Invoicing & Bank Details</h2>
      <p className="mt-1 text-xs text-ink-soft">
        Used on every generated invoice PDF: the invoice template never hardcodes these, so a change here applies
        to every future invoice immediately.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Payable to" htmlFor="ss-payable-to">
          <TextInput id="ss-payable-to" value={form.payableTo} onChange={(e) => set('payableTo', e.target.value)} />
        </Field>
        <Field label="Bank name" htmlFor="ss-bank-name">
          <TextInput id="ss-bank-name" value={form.bankName} onChange={(e) => set('bankName', e.target.value)} />
        </Field>
        <Field label="Account number" htmlFor="ss-account-number">
          <TextInput id="ss-account-number" value={form.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} />
        </Field>
        <Field label="Account name" htmlFor="ss-account-name">
          <TextInput id="ss-account-name" value={form.accountName} onChange={(e) => set('accountName', e.target.value)} />
        </Field>
        <Field label="SWIFT code" htmlFor="ss-swift-code">
          <TextInput id="ss-swift-code" value={form.swiftCode} onChange={(e) => set('swiftCode', e.target.value)} />
        </Field>
        <Field label="Bank address" htmlFor="ss-bank-address">
          <TextInput id="ss-bank-address" value={form.bankAddress} onChange={(e) => set('bankAddress', e.target.value)} />
        </Field>
        <Field label="Bank code" htmlFor="ss-bank-code">
          <TextInput id="ss-bank-code" value={form.bankCode} onChange={(e) => set('bankCode', e.target.value)} />
        </Field>
        <Field label="Branch code" htmlFor="ss-branch-code">
          <TextInput id="ss-branch-code" value={form.branchCode} onChange={(e) => set('branchCode', e.target.value)} />
        </Field>
        <Field label="Clearing code" htmlFor="ss-clearing-code">
          <TextInput id="ss-clearing-code" value={form.clearingCode} onChange={(e) => set('clearingCode', e.target.value)} />
        </Field>
        <Field label="Currency" htmlFor="ss-currency">
          <TextInput id="ss-currency" value={form.currency} onChange={(e) => set('currency', e.target.value)} />
        </Field>
        <Field label="Invoice due days" htmlFor="ss-due-days">
          <TextInput id="ss-due-days" type="number" min={0} value={form.invoiceDueDays} onChange={(e) => set('invoiceDueDays', e.target.value)} />
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
