'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import ReceiptUploadField from '@/components/admin/ReceiptUploadField';

function todayIso(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' });
}

export default function LogRevenueForm() {
  const router = useRouter();
  const [entryDate, setEntryDate] = useState(todayIso());
  const [amountIdr, setAmountIdr] = useState('');
  const [payerSource, setPayerSource] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash'>('bank_transfer');
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
      const res = await fetch('/api/admin/budget/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryDate, amountIdr, payerSource, description: description || null, paymentMethod, receiptUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setEntryDate(todayIso());
      setAmountIdr('');
      setPayerSource('');
      setDescription('');
      setPaymentMethod('bank_transfer');
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
      <h2 className="font-display text-lg font-semibold text-ink">Log revenue</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor="rev-date" required>
          <TextInput id="rev-date" type="date" required value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="!py-3 !text-base" />
        </Field>
        <Field label="Amount (IDR)" htmlFor="rev-amount" required>
          <TextInput
            id="rev-amount"
            type="number"
            inputMode="numeric"
            min="1"
            required
            value={amountIdr}
            onChange={(e) => setAmountIdr(e.target.value)}
            placeholder="e.g. 12700000"
            className="!py-3 !text-base"
          />
        </Field>
      </div>

      <Field label="Payer / source" htmlFor="rev-payer" required>
        <TextInput
          id="rev-payer"
          required
          value={payerSource}
          onChange={(e) => setPayerSource(e.target.value)}
          placeholder="e.g. Parent name, tuition"
          className="!py-3 !text-base"
        />
      </Field>

      <Field label="Description (optional)" htmlFor="rev-description">
        <TextArea id="rev-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="!text-base" />
      </Field>

      <fieldset>
        <legend className="mb-2 font-sans text-sm font-bold text-ink">
          Payment method <span className="text-orange-deep">*</span>
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {(['bank_transfer', 'cash'] as const).map((method) => (
            <label
              key={method}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 px-4 py-4 text-base font-semibold transition-colors ${
                paymentMethod === method ? 'border-teal bg-teal/10 text-teal-deep' : 'border-sand-line bg-white text-ink-soft'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method}
                checked={paymentMethod === method}
                onChange={() => setPaymentMethod(method)}
                className="sr-only"
              />
              {method === 'bank_transfer' ? 'Bank Transfer' : 'Cash'}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="mb-2 font-sans text-sm font-bold text-ink">Proof of payment</div>
        <ReceiptUploadField key={uploadKey} onUploaded={setReceiptUrl} />
      </div>

      {error && <p className="font-semibold text-orange-deep">{error}</p>}
      {saved && <p className="font-semibold text-teal-deep">Revenue entry saved.</p>}

      <Button type="submit" variant="primary" disabled={saving || !entryDate || !amountIdr || !payerSource.trim()}>
        {saving ? 'Saving…' : 'Save revenue entry'}
      </Button>
    </form>
  );
}
