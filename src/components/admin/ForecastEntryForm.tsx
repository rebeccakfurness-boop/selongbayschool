'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';

export default function ForecastEntryForm({
  quarterLabel,
  quarterStartDate,
  quarterEndDate,
  categories,
}: {
  quarterLabel: string;
  quarterStartDate: string;
  quarterEndDate: string;
  categories: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [entryType, setEntryType] = useState<'revenue' | 'expense'>('revenue');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [label, setLabel] = useState('');
  const [estimatedAmountIdr, setEstimatedAmountIdr] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/budget/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quarterLabel,
          quarterStartDate,
          quarterEndDate,
          entryType,
          categoryId: entryType === 'expense' ? categoryId : null,
          label,
          estimatedAmountIdr,
          notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setLabel('');
      setEstimatedAmountIdr('');
      setNotes('');
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
      <h2 className="font-display text-lg font-semibold text-ink">Add a forecast line — {quarterLabel}</h2>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setEntryType('revenue')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
            entryType === 'revenue' ? 'bg-teal text-white' : 'border border-sand-line text-ink hover:border-teal'
          }`}
        >
          Revenue estimate
        </button>
        <button
          type="button"
          onClick={() => setEntryType('expense')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
            entryType === 'expense' ? 'bg-orange-deep text-white' : 'border border-sand-line text-ink hover:border-orange-deep'
          }`}
        >
          Expense estimate
        </button>
      </div>

      {entryType === 'expense' && (
        <Field label="Category" htmlFor="fc-category" required>
          <select
            id="fc-category"
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
      )}

      <Field label="Label" htmlFor="fc-label" required>
        <TextInput
          id="fc-label"
          required
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={entryType === 'revenue' ? 'e.g. Tuition & fees' : 'e.g. New teacher hire'}
          className="!py-3 !text-base"
        />
      </Field>

      <Field label="Estimated amount (IDR)" htmlFor="fc-amount" required>
        <TextInput
          id="fc-amount"
          type="number"
          inputMode="numeric"
          min="1"
          required
          value={estimatedAmountIdr}
          onChange={(e) => setEstimatedAmountIdr(e.target.value)}
          placeholder="e.g. 50000000"
          className="!py-3 !text-base"
        />
      </Field>

      <Field label="Notes (optional)" htmlFor="fc-notes">
        <TextInput id="fc-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="!py-3 !text-base" />
      </Field>

      {error && <p className="font-semibold text-orange-deep">{error}</p>}
      {saved && <p className="font-semibold text-teal-deep">Forecast line saved.</p>}

      <Button type="submit" variant="primary" disabled={saving || !label.trim() || !estimatedAmountIdr}>
        {saving ? 'Saving…' : 'Add estimate'}
      </Button>
    </form>
  );
}
