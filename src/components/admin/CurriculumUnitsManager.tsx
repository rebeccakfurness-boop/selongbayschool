'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import { formatDate } from '@/lib/admin-format';

export interface CurriculumUnit {
  id: number;
  class_name: string;
  term_label: string;
  unit_title: string;
  description: string | null;
  is_current: boolean;
  created_at: string;
}

export default function CurriculumUnitsManager({ initial, classOptions }: { initial: CurriculumUnit[]; classOptions: string[] }) {
  const router = useRouter();
  const [units, setUnits] = useState(initial);
  const [className, setClassName] = useState(classOptions[0] ?? '');
  const [termLabel, setTermLabel] = useState('');
  const [unitTitle, setUnitTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/curriculum-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ className, termLabel, unitTitle, description: description || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save unit');
      setUnits((prev) => [
        { id: data.id, class_name: className, term_label: termLabel, unit_title: unitTitle, description: description || null, is_current: true, created_at: new Date().toISOString() },
        ...prev.map((u) => (u.class_name === className ? { ...u, is_current: false } : u)),
      ]);
      setTermLabel('');
      setUnitTitle('');
      setDescription('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save unit');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Set current curriculum unit</h2>
        <p className="mt-1 text-xs text-ink-soft">Saving marks this as the current unit for the class, replacing whichever was current before.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Class" htmlFor="cu-class" required>
            <TextInput id="cu-class" list="class-options-cu" required value={className} onChange={(e) => setClassName(e.target.value)} />
            <datalist id="class-options-cu">
              {classOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Term" htmlFor="cu-term" required>
            <TextInput id="cu-term" required value={termLabel} onChange={(e) => setTermLabel(e.target.value)} placeholder="e.g. Term 1 2026" />
          </Field>
          <Field label="Unit title" htmlFor="cu-title" required>
            <TextInput id="cu-title" required value={unitTitle} onChange={(e) => setUnitTitle(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Description" htmlFor="cu-description">
            <TextArea id="cu-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        {error && <p className="mt-3 font-semibold text-orange-deep">{error}</p>}
        <div className="mt-4">
          <Button type="button" variant="primary" onClick={create} disabled={saving || !className.trim() || !termLabel.trim() || !unitTitle.trim()}>
            {saving ? 'Saving…' : 'Save as current unit'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {units.map((u) => (
          <div key={u.id} className="rounded-md border border-sand-line bg-paper p-4 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-display text-base font-semibold text-ink">{u.unit_title}</div>
                <div className="text-xs text-ink-soft">
                  {u.class_name} · {u.term_label} · {formatDate(u.created_at)}
                </div>
                {u.description && <p className="mt-2 text-sm text-ink-soft">{u.description}</p>}
              </div>
              {u.is_current && (
                <span className="whitespace-nowrap rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal-deep">Current</span>
              )}
            </div>
          </div>
        ))}
        {units.length === 0 && (
          <div className="rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft">
            No curriculum units set yet.
          </div>
        )}
      </div>
    </div>
  );
}
