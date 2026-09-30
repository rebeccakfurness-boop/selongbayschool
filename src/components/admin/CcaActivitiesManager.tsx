'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import { formatIDR } from '@/lib/site-content';
import type { CcaActivityRow, CcaOptionRow } from '@/lib/cca';

function OptionsEditor({ activityId, options, onChanged }: { activityId: number; options: CcaOptionRow[]; onChanged: () => void }) {
  const [name, setName] = useState('');
  const [priceIDR, setPriceIDR] = useState('0');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addOption(e: FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cca/activities/${activityId}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, priceIDR: Number(priceIDR) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add option');
      setName('');
      setPriceIDR('0');
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add option');
    } finally {
      setAdding(false);
    }
  }

  async function removeOption(optionId: number) {
    if (!confirm('Remove this option?')) return;
    const res = await fetch(`/api/admin/cca/activities/${activityId}/options/${optionId}`, { method: 'DELETE' });
    if (res.ok) onChanged();
  }

  return (
    <div className="mt-2 rounded-sm border border-dashed border-sand-line p-3">
      <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">Options (parent picks exactly one)</div>
      <ul className="mt-2 flex flex-col gap-1">
        {options.map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-ink">{o.name} <span className="text-ink-soft">— {formatIDR(o.price_idr)}</span></span>
            <button type="button" onClick={() => removeOption(o.id)} className="text-xs font-semibold text-orange-deep hover:underline">
              Remove
            </button>
          </li>
        ))}
        {options.length === 0 && <li className="text-sm text-ink-soft">No options — this CCA is a single yes/no choice.</li>}
      </ul>
      <form onSubmit={addOption} className="mt-2 flex flex-wrap items-end gap-2">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Option name" className="w-40" required />
        <TextInput type="number" min={0} step={1000} value={priceIDR} onChange={(e) => setPriceIDR(e.target.value)} className="w-28" />
        <Button type="submit" variant="ghost" className="px-3 py-1.5 text-xs" disabled={adding}>
          {adding ? 'Adding…' : '+ Add option'}
        </Button>
      </form>
      {error && <p className="mt-1 text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}

function CcaActivityRow({ activity, onSaved }: { activity: CcaActivityRow; onSaved: () => void }) {
  const [name, setName] = useState(activity.name);
  const [dayOfWeek, setDayOfWeek] = useState(activity.day_of_week ?? '');
  const [description, setDescription] = useState(activity.description ?? '');
  const [defaultPriceIDR, setDefaultPriceIDR] = useState(String(activity.default_price_idr));
  const [minStudents, setMinStudents] = useState(activity.min_students != null ? String(activity.min_students) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(activity.options.length > 0);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cca/activities/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function save() {
    patch({
      name,
      dayOfWeek,
      description,
      defaultPriceIDR: Number(defaultPriceIDR),
      minStudents: minStudents === '' ? null : Number(minStudents),
    });
  }

  async function remove() {
    if (!confirm(`Delete "${activity.name}"? This can't be undone.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/cca/activities/${activity.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className={`border-b border-sand-line/60 last:border-0 align-top ${activity.is_active ? '' : 'opacity-60'}`}>
      <td className="px-3 py-2"><TextInput value={name} onChange={(e) => setName(e.target.value)} className="w-40" /></td>
      <td className="px-3 py-2"><TextInput value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className="w-28" placeholder="e.g. Tuesdays" /></td>
      <td className="px-3 py-2"><TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-56 resize-y" /></td>
      <td className="px-3 py-2">
        <TextInput type="number" min={0} step={1000} value={defaultPriceIDR} onChange={(e) => setDefaultPriceIDR(e.target.value)} className="w-28" disabled={activity.options.length > 0} />
        <div className="mt-1 text-xs font-semibold text-ink-soft">{activity.options.length > 0 ? '(priced per option)' : formatIDR(Number(defaultPriceIDR))}</div>
      </td>
      <td className="px-3 py-2"><TextInput type="number" min={1} value={minStudents} onChange={(e) => setMinStudents(e.target.value)} className="w-20" placeholder="None" /></td>
      <td className="px-3 py-2 text-center">
        <button
          type="button"
          onClick={() => patch({ isActive: !activity.is_active })}
          disabled={saving}
          className={`rounded-full px-3 py-1 text-xs font-bold ${activity.is_active ? 'bg-teal/15 text-teal-deep' : 'bg-sand text-ink-soft'}`}
        >
          {activity.is_active ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-col items-start gap-1.5">
          <Button type="button" variant="ghost" className="px-4 py-1.5 text-xs" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <button type="button" onClick={() => setShowOptions((v) => !v)} className="text-xs font-semibold text-teal-deep hover:underline">
            {showOptions ? 'Hide options' : 'Options'}
          </button>
          <button type="button" onClick={remove} disabled={saving} className="text-xs font-semibold text-orange-deep hover:underline">
            Delete
          </button>
          {error && <div className="max-w-[10rem] text-xs font-semibold text-orange-deep">{error}</div>}
          {showOptions && (
            <div className="w-64">
              <OptionsEditor activityId={activity.id} options={activity.options} onChanged={onSaved} />
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function CcaActivitiesManager() {
  const [activities, setActivities] = useState<CcaActivityRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newDayOfWeek, setNewDayOfWeek] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDefaultPriceIDR, setNewDefaultPriceIDR] = useState('0');
  const [newMinStudents, setNewMinStudents] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function loadActivities() {
    try {
      const res = await fetch('/api/admin/cca/activities');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setActivities(data.activities);
    } catch {
      setError('Could not load CCAs.');
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadActivities();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch('/api/admin/cca/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          dayOfWeek: newDayOfWeek,
          description: newDescription,
          defaultPriceIDR: Number(newDefaultPriceIDR),
          minStudents: newMinStudents === '' ? undefined : Number(newMinStudents),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create CCA');
      setNewName('');
      setNewDayOfWeek('');
      setNewDescription('');
      setNewDefaultPriceIDR('0');
      setNewMinStudents('');
      await loadActivities();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to create CCA');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="font-display text-xl font-semibold text-ink">CCA Catalog</h2>
        {error && <p role="alert" className="mt-2 font-semibold text-orange-deep">{error}</p>}
        <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-sand-line bg-sand/40 text-left">
                <th className="px-3 py-3 font-bold text-ink-soft">Name</th>
                <th className="px-3 py-3 font-bold text-ink-soft">Day</th>
                <th className="px-3 py-3 font-bold text-ink-soft">Description</th>
                <th className="px-3 py-3 font-bold text-ink-soft">Price (IDR)</th>
                <th className="px-3 py-3 font-bold text-ink-soft">Min. students</th>
                <th className="px-3 py-3 font-bold text-ink-soft">Active</th>
                <th className="px-3 py-3 font-bold text-ink-soft"></th>
              </tr>
            </thead>
            <tbody>
              {activities?.map((activity) => (
                <CcaActivityRow key={activity.id} activity={activity} onSaved={loadActivities} />
              ))}
              {activities && activities.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">No CCAs yet. Add one below.</td>
                </tr>
              )}
              {!activities && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">Loading…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-ink">Add CCA</h2>
        <form onSubmit={handleAdd} className="mt-4 grid gap-4 rounded-md border border-sand-line bg-paper p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Name" htmlFor="cca-name" required>
            <TextInput id="cca-name" required value={newName} onChange={(e) => setNewName(e.target.value)} />
          </Field>
          <Field label="Day" htmlFor="cca-day">
            <TextInput id="cca-day" value={newDayOfWeek} onChange={(e) => setNewDayOfWeek(e.target.value)} placeholder="e.g. Tuesdays" />
          </Field>
          <Field label="Default price (IDR, if no options)" htmlFor="cca-price">
            <TextInput id="cca-price" type="number" min={0} step={1000} value={newDefaultPriceIDR} onChange={(e) => setNewDefaultPriceIDR(e.target.value)} />
          </Field>
          <Field label="Minimum students to run" htmlFor="cca-min">
            <TextInput id="cca-min" type="number" min={1} value={newMinStudents} onChange={(e) => setNewMinStudents(e.target.value)} placeholder="No minimum" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Field label="Description" htmlFor="cca-description">
              <TextArea id="cca-description" rows={3} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            </Field>
          </div>
          {addError && <p role="alert" className="sm:col-span-2 lg:col-span-4 font-semibold text-orange-deep">{addError}</p>}
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" variant="primary" disabled={adding}>
              {adding ? 'Adding…' : 'Add CCA'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
