'use client';

import { useState } from 'react';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import Button from '@/components/Button';
import { formatDate } from '@/lib/admin-format';

const ENDPOINT = '/api/serangan/campaigns';

export interface SeranganCampaignItem {
  id: number;
  title: string;
  description: string | null;
  status: 'planned' | 'active' | 'completed';
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
}

const STATUS_LABEL: Record<SeranganCampaignItem['status'], string> = { planned: 'Planned', active: 'Active', completed: 'Completed' };
const STATUS_BADGE: Record<SeranganCampaignItem['status'], string> = {
  planned: 'bg-ink/10 text-ink-soft',
  active: 'bg-orange/20 text-orange-deep',
  completed: 'bg-teal/15 text-teal-deep',
};

const emptyForm = { title: '', description: '', status: 'planned' as SeranganCampaignItem['status'], startDate: '', endDate: '', notes: '' };

export default function SeranganCampaignsManager({ initial }: { initial: SeranganCampaignItem[] }) {
  const [campaigns, setCampaigns] = useState(initial);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(ENDPOINT);
    const data = await res.json().catch(() => ({}));
    if (res.ok) setCampaigns(data.campaigns);
  }

  function startEdit(c: SeranganCampaignItem) {
    setEditingId(c.id);
    setForm({ title: c.title, description: c.description ?? '', status: c.status, startDate: c.start_date ?? '', endDate: c.end_date ?? '', notes: c.notes ?? '' });
  }
  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  const canSave = form.title.trim();

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(editingId ? `${ENDPOINT}/${editingId}` : ENDPOINT, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save that campaign.');
      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that campaign.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    await fetch(`${ENDPOINT}/${id}`, { method: 'DELETE' });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">{editingId ? 'Edit campaign' : 'New campaign'}</h2>
        <p className="mt-1 text-xs text-ink-soft">e.g. &ldquo;Design new T-shirts&rdquo;, &ldquo;Fundraiser day&rdquo;, &ldquo;Learn to swim day&rdquo;.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Title" htmlFor="camp-title" required>
            <TextInput id="camp-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field label="Status" htmlFor="camp-status">
            <select
              id="camp-status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SeranganCampaignItem['status'] }))}
              className="w-full rounded-sm border border-sand-line bg-white px-3 py-2 text-sm"
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
          <Field label="Start date (optional)" htmlFor="camp-start">
            <TextInput id="camp-start" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          </Field>
          <Field label="End date (optional)" htmlFor="camp-end">
            <TextInput id="camp-end" type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Description" htmlFor="camp-desc">
            <TextArea id="camp-desc" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Notes (optional)" htmlFor="camp-notes">
            <TextArea id="camp-notes" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button type="button" variant="primary" onClick={save} disabled={!canSave || saving}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add campaign'}
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
        {campaigns.map((c) => (
          <div key={c.id} className="flex items-start justify-between gap-3 rounded-md border border-sand-line bg-paper p-4 text-sm">
            <div>
              <p className="font-semibold text-ink">
                {c.title} <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_BADGE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
              </p>
              {c.description && <p className="mt-1 text-ink-soft">{c.description}</p>}
              {(c.start_date || c.end_date) && (
                <p className="mt-1 text-xs text-ink-soft">
                  {c.start_date ? formatDate(c.start_date) : '—'} to {c.end_date ? formatDate(c.end_date) : '—'}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <button type="button" onClick={() => startEdit(c)} className="text-xs font-semibold text-teal-deep hover:underline">Edit</button>
              <button type="button" onClick={() => remove(c.id)} className="text-xs font-semibold text-orange-deep hover:underline">Remove</button>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && <p className="text-sm text-ink-soft">No campaigns yet.</p>}
      </div>
    </div>
  );
}
