'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import type { CcaSettingsRow } from '@/lib/cca';

/** Mirrors computeCcaTermWeeks in src/lib/cca.ts -- duplicated rather than imported since that
 * module pulls in the server-only DB client, which can't be bundled into this 'use client' form.
 * Preview only; the real pricing multiplier is always computed server-side. */
function previewTermWeeks(termStartDate: string, termEndDate: string): number | null {
  if (!termStartDate || !termEndDate) return null;
  const start = new Date(`${termStartDate}T00:00:00Z`).getTime();
  const end = new Date(`${termEndDate}T00:00:00Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.max(1, Math.ceil((end - start) / (7 * 24 * 60 * 60 * 1000)));
}

export default function CcaSettingsForm({ initial }: { initial: CcaSettingsRow }) {
  const router = useRouter();
  const [form, setForm] = useState({
    termLabel: initial.term_label,
    termStartDate: initial.term_start_date ?? '',
    termEndDate: initial.term_end_date ?? '',
    selectionOpen: initial.selection_open,
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
      const res = await fetch('/api/admin/cca/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          termStartDate: form.termStartDate || null,
          termEndDate: form.termEndDate || null,
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

  const notConfigured = !initial.term_label || !initial.selection_open;
  const weeksPreview = previewTermWeeks(form.termStartDate, form.termEndDate);

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold text-ink">CCA Term Settings</h2>
      <p className="mt-1 text-xs text-ink-soft">
        One active term at a time. Closing selections doesn&apos;t affect anything already submitted -- it only stops
        new submissions and changes to existing ones.
      </p>
      {notConfigured && (
        <p className="mt-3 rounded-sm bg-orange/10 px-3 py-2 text-xs font-semibold text-orange-deep">
          {!initial.term_label ? 'Not fully set up yet: set a term label before parents can submit selections.' : 'Selections are currently closed to parents.'}
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Term label" htmlFor="cca-term-label">
          <TextInput id="cca-term-label" value={form.termLabel} onChange={(e) => set('termLabel', e.target.value)} placeholder="e.g. Term 2 2026" />
        </Field>
        <Field label="Term start date" htmlFor="cca-term-start">
          <TextInput id="cca-term-start" type="date" value={form.termStartDate} onChange={(e) => set('termStartDate', e.target.value)} />
        </Field>
        <Field label="Term end date" htmlFor="cca-term-end">
          <TextInput id="cca-term-end" type="date" value={form.termEndDate} onChange={(e) => set('termEndDate', e.target.value)} />
        </Field>
      </div>
      {weeksPreview != null && (
        <p className="mt-2 text-xs text-ink-soft">
          {weeksPreview} week{weeksPreview === 1 ? '' : 's'} — every CCA&apos;s per-week price is multiplied by this when a parent selects it.
        </p>
      )}
      <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink">
        <input type="checkbox" checked={form.selectionOpen} onChange={(e) => set('selectionOpen', e.target.checked)} className="h-4 w-4" />
        Selections open to parents
      </label>

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
