'use client';

import { useState } from 'react';
import { Field, TextInput } from '@/components/forms/FormField';
import Button from '@/components/Button';

const ENDPOINT = '/api/serangan/expenditures';

function todayValue(): string {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = { expenseDate: todayValue(), category: '', description: '', amountIdr: '' };

/** Deliberately write-only -- no list, no running total, nothing fetched back from the server.
 * A 'staff' account is allowed to log an expense but must never see the overall transaction
 * history (see requireSeranganAdminApi), so this form never calls the expenditures GET route. */
export default function SeranganLogExpenseForm() {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const canSave = form.expenseDate && form.description.trim() && form.amountIdr !== '';

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amountIdr: Number(form.amountIdr) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save that expense.');
      setForm({ ...emptyForm, expenseDate: form.expenseDate });
      setSavedCount((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that expense.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor="le-date" required>
          <TextInput id="le-date" type="date" value={form.expenseDate} onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))} />
        </Field>
        <Field label="Category (optional)" htmlFor="le-category">
          <TextInput id="le-category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Materials, Snacks, T-shirts" />
        </Field>
        <Field label="Description" htmlFor="le-description" required>
          <TextInput id="le-description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What was it for?" />
        </Field>
        <Field label="Amount (IDR)" htmlFor="le-amount" required>
          <TextInput id="le-amount" type="number" min={0} value={form.amountIdr} onChange={(e) => setForm((f) => ({ ...f, amountIdr: e.target.value }))} />
        </Field>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button type="button" variant="primary" onClick={save} disabled={!canSave || saving}>
          {saving ? 'Saving…' : 'Log expense'}
        </Button>
        {savedCount > 0 && <span className="text-sm font-semibold text-teal-deep">Saved -- {savedCount} logged this session.</span>}
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
