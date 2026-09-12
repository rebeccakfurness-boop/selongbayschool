'use client';

import { useEffect, useState } from 'react';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import Button from '@/components/Button';
import { formatDate } from '@/lib/admin-format';

interface PdEntry {
  id: number;
  title: string;
  provider: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes: string | null;
}

const STATUS_LABEL: Record<PdEntry['status'], string> = { upcoming: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled' };
const STATUS_CLASS: Record<PdEntry['status'], string> = {
  upcoming: 'bg-orange/20 text-orange-deep',
  completed: 'bg-teal/15 text-teal-deep',
  cancelled: 'bg-ink/10 text-ink-soft',
};

/** Self-fetching, same reason as AttendanceSection -- GET is allowed for the owning staff member
 * too (self-service "what have I got booked"), so this section also renders on a teacher's own
 * read-only view of their Staff Card, not just the admin one. */
export default function StaffProfessionalDevelopmentSection({ adminUserId, canEdit }: { adminUserId: number; canEdit: boolean }) {
  const [entries, setEntries] = useState<PdEntry[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<PdEntry['status']>('upcoming');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/admin/staff/${adminUserId}/professional-development`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) setEntries(data.entries);
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/staff/${adminUserId}/professional-development`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled || !ok) return;
        setEntries(data.entries);
      });
    return () => {
      cancelled = true;
    };
  }, [adminUserId]);

  async function add() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff/${adminUserId}/professional-development`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          provider: provider.trim() || null,
          startDate: startDate || null,
          endDate: endDate || null,
          status,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not add that entry.');
      setTitle('');
      setProvider('');
      setStartDate('');
      setEndDate('');
      setStatus('upcoming');
      setNotes('');
      setAdding(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add that entry.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    await fetch(`/api/admin/staff/${adminUserId}/professional-development/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Professional Development</h2>
        {canEdit && (
          <button type="button" onClick={() => setAdding((v) => !v)} className="text-sm font-semibold text-teal-deep hover:underline">
            {adding ? 'Cancel' : '+ Add'}
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-4 flex flex-col gap-3 rounded-sm border border-dashed border-sand-line p-4">
          <Field label="Title" htmlFor="pd-title" required>
            <TextInput id="pd-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cambridge Primary Maths Workshop" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Provider" htmlFor="pd-provider">
              <TextInput id="pd-provider" value={provider} onChange={(e) => setProvider(e.target.value)} />
            </Field>
            <Field label="Start date" htmlFor="pd-start">
              <TextInput id="pd-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="End date" htmlFor="pd-end">
              <TextInput id="pd-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Status" htmlFor="pd-status">
            <select id="pd-status" value={status} onChange={(e) => setStatus(e.target.value as PdEntry['status'])} className="rounded-sm border border-sand-line bg-white px-3 py-2 text-sm">
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>
          <Field label="Notes" htmlFor="pd-notes">
            <TextArea id="pd-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div>
            <Button type="button" variant="primary" onClick={add} disabled={saving || !title.trim()}>
              {saving ? 'Adding…' : 'Add entry'}
            </Button>
          </div>
          {error && <p className="text-xs font-semibold text-orange-deep">{error}</p>}
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {entries?.map((e) => (
          <li key={e.id} className="flex items-start justify-between gap-2 rounded-sm border border-sand-line p-3 text-sm">
            <div>
              <p className="font-semibold text-ink">
                {e.title} <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_CLASS[e.status]}`}>{STATUS_LABEL[e.status]}</span>
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                {e.provider}
                {e.start_date && ` · ${formatDate(e.start_date)}${e.end_date && e.end_date !== e.start_date ? ` – ${formatDate(e.end_date)}` : ''}`}
              </p>
              {e.notes && <p className="mt-1 text-xs text-ink-soft">{e.notes}</p>}
            </div>
            {canEdit && (
              <button type="button" onClick={() => remove(e.id)} className="whitespace-nowrap text-xs font-semibold text-orange-deep hover:underline">
                Remove
              </button>
            )}
          </li>
        ))}
        {entries?.length === 0 && <li className="text-sm text-ink-soft">Nothing on file yet.</li>}
        {entries === null && <li className="text-sm text-ink-soft">Loading…</li>}
      </ul>
    </div>
  );
}
