'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import type { BudgetSettingsRow } from '@/lib/budget';

export default function BudgetSettingsForm({ settings }: { settings: BudgetSettingsRow }) {
  const router = useRouter();
  const [termLabel, setTermLabel] = useState(settings.term_label);
  const [termStartDate, setTermStartDate] = useState(settings.term_start_date);
  const [termEndDate, setTermEndDate] = useState(settings.term_end_date);
  const [openingCashIdr, setOpeningCashIdr] = useState(String(settings.opening_cash_idr));
  const [openingCashAsOf, setOpeningCashAsOf] = useState(settings.opening_cash_as_of);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/budget/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termLabel, termStartDate, termEndDate, openingCashIdr, openingCashAsOf }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold text-ink">Term &amp; cash settings</h2>
      <p className="mt-1 text-xs text-ink-soft">
        Drives the &quot;current term&quot; totals and &quot;cash on hand&quot; figure on the Dashboard. Cash on hand =
        this opening balance, plus every revenue/expense logged since.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Term label" htmlFor="set-term-label" required>
          <TextInput id="set-term-label" value={termLabel} onChange={(e) => setTermLabel(e.target.value)} />
        </Field>
        <div />
        <Field label="Term start" htmlFor="set-term-start" required>
          <TextInput id="set-term-start" type="date" value={termStartDate} onChange={(e) => setTermStartDate(e.target.value)} />
        </Field>
        <Field label="Term end" htmlFor="set-term-end" required>
          <TextInput id="set-term-end" type="date" value={termEndDate} onChange={(e) => setTermEndDate(e.target.value)} />
        </Field>
        <Field label="Opening cash balance (IDR)" htmlFor="set-cash" required>
          <TextInput id="set-cash" type="number" inputMode="numeric" min="0" value={openingCashIdr} onChange={(e) => setOpeningCashIdr(e.target.value)} />
        </Field>
        <Field label="Balance as of" htmlFor="set-cash-date" required>
          <TextInput id="set-cash-date" type="date" value={openingCashAsOf} onChange={(e) => setOpeningCashAsOf(e.target.value)} />
        </Field>
      </div>
      {error && <p className="mt-3 font-semibold text-orange-deep">{error}</p>}
      {saved && <p className="mt-3 font-semibold text-teal-deep">Settings saved.</p>}
      <div className="mt-4">
        <Button type="button" variant="primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </div>
  );
}
