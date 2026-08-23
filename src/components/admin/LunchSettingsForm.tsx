'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';

export interface LunchSettings {
  supplier_name: string;
  supplier_email: string | null;
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
  normal_price_idr: number;
  large_price_idr: number;
}

export default function LunchSettingsForm({ initial }: { initial: LunchSettings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    supplierName: initial.supplier_name,
    supplierEmail: initial.supplier_email ?? '',
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
    normalPriceIdr: String(initial.normal_price_idr),
    largePriceIdr: String(initial.large_price_idr),
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
      const res = await fetch('/api/admin/lunch-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          invoiceDueDays: Number(form.invoiceDueDays),
          normalPriceIdr: Number(form.normalPriceIdr),
          largePriceIdr: Number(form.largePriceIdr),
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

  const notConfigured = initial.normal_price_idr <= 0 || initial.large_price_idr <= 0 || !initial.payable_to || !initial.bank_name || !initial.account_number;

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold text-ink">Lunch Ordering</h2>
      <p className="mt-1 text-xs text-ink-soft">
        Pricing and the lunch supplier&apos;s own bank details, used on every lunch invoice generated when a parent
        orders lunches from their portal. If a supplier email is set, they&apos;re automatically sent a copy of each
        order&apos;s details (dates, days, size, food preference, allergies) so they know what to prepare.
      </p>
      {notConfigured && (
        <p className="mt-3 rounded-sm bg-orange/10 px-3 py-2 text-xs font-semibold text-orange-deep">
          Not fully set up yet: parents can&apos;t order lunches until pricing (both sizes) and bank details are filled in.
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Supplier name" htmlFor="ls-supplier-name">
          <TextInput id="ls-supplier-name" value={form.supplierName} onChange={(e) => set('supplierName', e.target.value)} />
        </Field>
        <Field label="Supplier email (order copies sent here)" htmlFor="ls-supplier-email">
          <TextInput id="ls-supplier-email" type="email" value={form.supplierEmail} onChange={(e) => set('supplierEmail', e.target.value)} placeholder="kitchen@supplier.com" />
        </Field>
        <Field label="Normal lunch price (IDR)" htmlFor="ls-normal-price">
          <TextInput id="ls-normal-price" type="number" min={0} value={form.normalPriceIdr} onChange={(e) => set('normalPriceIdr', e.target.value)} />
        </Field>
        <Field label="Large lunch price (IDR)" htmlFor="ls-large-price">
          <TextInput id="ls-large-price" type="number" min={0} value={form.largePriceIdr} onChange={(e) => set('largePriceIdr', e.target.value)} />
        </Field>
        <Field label="Payable to" htmlFor="ls-payable-to">
          <TextInput id="ls-payable-to" value={form.payableTo} onChange={(e) => set('payableTo', e.target.value)} />
        </Field>
        <Field label="Bank name" htmlFor="ls-bank-name">
          <TextInput id="ls-bank-name" value={form.bankName} onChange={(e) => set('bankName', e.target.value)} />
        </Field>
        <Field label="Account number" htmlFor="ls-account-number">
          <TextInput id="ls-account-number" value={form.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} />
        </Field>
        <Field label="Account name" htmlFor="ls-account-name">
          <TextInput id="ls-account-name" value={form.accountName} onChange={(e) => set('accountName', e.target.value)} />
        </Field>
        <Field label="SWIFT code" htmlFor="ls-swift-code">
          <TextInput id="ls-swift-code" value={form.swiftCode} onChange={(e) => set('swiftCode', e.target.value)} />
        </Field>
        <Field label="Bank address" htmlFor="ls-bank-address">
          <TextInput id="ls-bank-address" value={form.bankAddress} onChange={(e) => set('bankAddress', e.target.value)} />
        </Field>
        <Field label="Bank code" htmlFor="ls-bank-code">
          <TextInput id="ls-bank-code" value={form.bankCode} onChange={(e) => set('bankCode', e.target.value)} />
        </Field>
        <Field label="Branch code" htmlFor="ls-branch-code">
          <TextInput id="ls-branch-code" value={form.branchCode} onChange={(e) => set('branchCode', e.target.value)} />
        </Field>
        <Field label="Clearing code" htmlFor="ls-clearing-code">
          <TextInput id="ls-clearing-code" value={form.clearingCode} onChange={(e) => set('clearingCode', e.target.value)} />
        </Field>
        <Field label="Currency" htmlFor="ls-currency">
          <TextInput id="ls-currency" value={form.currency} onChange={(e) => set('currency', e.target.value)} />
        </Field>
        <Field label="Invoice due days" htmlFor="ls-due-days">
          <TextInput id="ls-due-days" type="number" min={0} value={form.invoiceDueDays} onChange={(e) => set('invoiceDueDays', e.target.value)} />
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
