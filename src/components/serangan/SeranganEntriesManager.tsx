'use client';

import { useState } from 'react';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import Button from '@/components/Button';
import { formatDate } from '@/lib/admin-format';

const ENDPOINT = '/api/serangan/entries';

export interface SeranganEntryItem {
  id: number;
  entry_date: string;
  activity: string;
  staff_present: string | null;
  visitors_present: string | null;
  children_count: number | null;
  boys_estimate: number | null;
  girls_estimate: number | null;
  age_estimate_note: string | null;
  notes: string | null;
}

function todayValue(): string {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = {
  entryDate: todayValue(),
  activity: '',
  staffPresent: '',
  visitorsPresent: '',
  childrenCount: '',
  boysEstimate: '',
  girlsEstimate: '',
  ageEstimateNote: '',
  notes: '',
};

export default function SeranganEntriesManager({ initial }: { initial: SeranganEntryItem[] }) {
  const [entries, setEntries] = useState(initial);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(ENDPOINT);
    const data = await res.json().catch(() => ({}));
    if (res.ok) setEntries(data.entries);
  }

  function startEdit(e: SeranganEntryItem) {
    setEditingId(e.id);
    setForm({
      entryDate: e.entry_date,
      activity: e.activity,
      staffPresent: e.staff_present ?? '',
      visitorsPresent: e.visitors_present ?? '',
      childrenCount: e.children_count !== null ? String(e.children_count) : '',
      boysEstimate: e.boys_estimate !== null ? String(e.boys_estimate) : '',
      girlsEstimate: e.girls_estimate !== null ? String(e.girls_estimate) : '',
      ageEstimateNote: e.age_estimate_note ?? '',
      notes: e.notes ?? '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  const canSave = form.entryDate && form.activity.trim();

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(editingId ? `${ENDPOINT}/${editingId}` : ENDPOINT, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          childrenCount: form.childrenCount === '' ? null : Number(form.childrenCount),
          boysEstimate: form.boysEstimate === '' ? null : Number(form.boysEstimate),
          girlsEstimate: form.girlsEstimate === '' ? null : Number(form.girlsEstimate),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save that entry.');
      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that entry.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await fetch(`${ENDPOINT}/${id}`, { method: 'DELETE' });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">{editingId ? 'Edit session' : 'Log this week’s session'}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Date" htmlFor="se-date" required>
            <TextInput id="se-date" type="date" value={form.entryDate} onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))} />
          </Field>
          <Field label="Activity" htmlFor="se-activity" required>
            <TextInput id="se-activity" value={form.activity} onChange={(e) => setForm((f) => ({ ...f, activity: e.target.value }))} placeholder="e.g. English conversation class" />
          </Field>
          <Field label="Teachers / local staff present" htmlFor="se-staff">
            <TextInput id="se-staff" value={form.staffPresent} onChange={(e) => setForm((f) => ({ ...f, staffPresent: e.target.value }))} placeholder="Names, or a headcount" />
          </Field>
          <Field label="Visitors present" htmlFor="se-visitors">
            <TextInput id="se-visitors" value={form.visitorsPresent} onChange={(e) => setForm((f) => ({ ...f, visitorsPresent: e.target.value }))} placeholder="Names, or a headcount" />
          </Field>
          <Field label="Number of local children attending" htmlFor="se-children">
            <TextInput id="se-children" type="number" min={0} value={form.childrenCount} onChange={(e) => setForm((f) => ({ ...f, childrenCount: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Boys (estimate)" htmlFor="se-boys">
              <TextInput id="se-boys" type="number" min={0} value={form.boysEstimate} onChange={(e) => setForm((f) => ({ ...f, boysEstimate: e.target.value }))} />
            </Field>
            <Field label="Girls (estimate)" htmlFor="se-girls">
              <TextInput id="se-girls" type="number" min={0} value={form.girlsEstimate} onChange={(e) => setForm((f) => ({ ...f, girlsEstimate: e.target.value }))} />
            </Field>
          </div>
          <Field label="Estimated ages" htmlFor="se-ages">
            <TextInput id="se-ages" value={form.ageEstimateNote} onChange={(e) => setForm((f) => ({ ...f, ageEstimateNote: e.target.value }))} placeholder="e.g. mostly 6-12 years old" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Notes" htmlFor="se-notes">
            <TextArea id="se-notes" rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Anything else worth recording about this session." />
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button type="button" variant="primary" onClick={save} disabled={!canSave || saving}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add session'}
          </Button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-xs font-semibold text-ink-soft hover:underline">
              Cancel
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
      </div>

      <div className="flex flex-col gap-2">
        {entries.map((e) => (
          <div key={e.id} className="flex items-start justify-between gap-3 rounded-md border border-sand-line bg-paper p-4 text-sm">
            <div>
              <p className="font-semibold text-ink">
                {formatDate(e.entry_date)} &middot; {e.activity}
              </p>
              <p className="mt-1 text-ink-soft">
                {e.children_count ?? '—'} children
                {(e.boys_estimate !== null || e.girls_estimate !== null) && ` (≈${e.boys_estimate ?? '?'} boys / ${e.girls_estimate ?? '?'} girls)`}
                {e.age_estimate_note && ` · ${e.age_estimate_note}`}
              </p>
              {(e.staff_present || e.visitors_present) && (
                <p className="mt-1 text-xs text-ink-soft">
                  {e.staff_present && <>Staff: {e.staff_present}</>}
                  {e.staff_present && e.visitors_present && ' · '}
                  {e.visitors_present && <>Visitors: {e.visitors_present}</>}
                </p>
              )}
              {e.notes && <p className="mt-1 text-xs text-ink-soft">{e.notes}</p>}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <button type="button" onClick={() => startEdit(e)} className="text-xs font-semibold text-teal-deep hover:underline">Edit</button>
              <button type="button" onClick={() => remove(e.id)} className="text-xs font-semibold text-orange-deep hover:underline">Remove</button>
            </div>
          </div>
        ))}
        {entries.length === 0 && <p className="text-sm text-ink-soft">No sessions logged yet.</p>}
      </div>
    </div>
  );
}
