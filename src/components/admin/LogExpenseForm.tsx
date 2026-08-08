'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import ReceiptUploadField from '@/components/admin/ReceiptUploadField';

function todayIso(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' });
}

export default function LogExpenseForm({ categories }: { categories: { id: number; name: string }[] }) {
  const router = useRouter();
  const [entryDate, setEntryDate] = useState(todayIso());
  const [amountIdr, setAmountIdr] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [vendorDescription, setVendorDescription] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/budget/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryDate, amountIdr, categoryId, vendorDescription, authorizedBy, receiptUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setEntryDate(todayIso());
      setAmountIdr('');
      setVendorDescription('');
      setAuthorizedBy('');
      setReceiptUrl(null);
      setUploadKey((k) => k + 1);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-md border border-sand-line bg-paper p-6 shadow-soft" noValidate>
      <h2 className="font-display text-lg font-semibold text-ink">Log expense</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor="exp-date" required>
          <TextInput id="exp-date" type="date" required value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="!py-3 !text-base" />
        </Field>
        <Field label="Amount (IDR)" htmlFor="exp-amount" required>
          <TextInput
            id="exp-amount"
            type="number"
            inputMode="numeric"
            min="1"
            required
            value={amountIdr}
            onChange={(e) => setAmountIdr(e.target.value)}
            placeholder="e.g. 350000"
            className="!py-3 !text-base"
          />
        </Field>
      </div>

      <Field label="Category" htmlFor="exp-category" required>
        <select
          id="exp-category"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          className="w-full rounded-sm border border-sand-line bg-white px-4 py-3 text-base text-ink"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Vendor / description" htmlFor="exp-vendor" required>
        <TextInput
          id="exp-vendor"
          required
          value={vendorDescription}
          onChange={(e) => setVendorDescription(e.target.value)}
          placeholder="e.g. Toko ABC, whiteboard markers"
          className="!py-3 !text-base"
        />
      </Field>

      <Field label="Authorized / spent by" htmlFor="exp-authorized" required>
        <TextInput
          id="exp-authorized"
          required
          value={authorizedBy}
          onChange={(e) => setAuthorizedBy(e.target.value)}
          placeholder="e.g. Ms Indhira"
          className="!py-3 !text-base"
        />
      </Field>

      <div>
        <div className="mb-2 font-sans text-sm font-bold text-ink">Receipt</div>
        <ReceiptUploadField key={uploadKey} label="receipt" onUploaded={setReceiptUrl} />
      </div>

      {error && <p className="font-semibold text-orange-deep">{error}</p>}
      {saved && <p className="font-semibold text-teal-deep">Expense entry saved.</p>}

      <Button type="submit" variant="primary" disabled={saving || !entryDate || !amountIdr || !categoryId || !vendorDescription.trim() || !authorizedBy.trim()}>
        {saving ? 'Saving…' : 'Save expense entry'}
      </Button>
    </form>
  );
}
