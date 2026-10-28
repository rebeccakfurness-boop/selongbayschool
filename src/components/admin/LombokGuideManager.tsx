'use client';

import { useState } from 'react';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import Button from '@/components/Button';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/lib/lombok-guide';

const ENDPOINT = '/api/admin/lombok-guide';

export interface GuideEntryItem {
  id: number;
  category: string;
  title: string;
  description: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  is_active: boolean;
}

const emptyForm = { category: 'real_estate', title: '', description: '', address: '', phone: '', website: '', isActive: true };

/** Admin-only directory of local "settling in" info shown on the parent portal's Lombok Guide
 * page and in the PDF sent to new families. Same compose-form-plus-list shape as
 * PartnerDiscountsManager/CommunityFeedManager. */
export default function LombokGuideManager({ initial }: { initial: GuideEntryItem[] }) {
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

  function startEdit(e: GuideEntryItem) {
    setEditingId(e.id);
    setForm({ category: e.category, title: e.title, description: e.description, address: e.address ?? '', phone: e.phone ?? '', website: e.website ?? '', isActive: e.is_active });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  const canSave = form.title.trim() && form.description.trim();

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

  async function toggleActive(e: GuideEntryItem) {
    await fetch(`${ENDPOINT}/${e.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: e.category, title: e.title, description: e.description, address: e.address ?? '', phone: e.phone ?? '', website: e.website ?? '', isActive: !e.is_active }),
    });
    await load();
  }

  const byCategory = CATEGORY_ORDER.map((c) => ({ category: c, label: CATEGORY_LABELS[c], items: entries.filter((e) => e.category === c) })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">{editingId ? 'Edit entry' : 'Add a guide entry'}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="lg-title" required>
            <TextInput id="lg-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Gili Rentals Lombok" />
          </Field>
          <Field label="Category" htmlFor="lg-category">
            <select
              id="lg-category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-sm border border-sand-line bg-white px-3 py-2 text-sm"
            >
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </Field>
          <Field label="Address (optional)" htmlFor="lg-address">
            <TextInput id="lg-address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </Field>
          <Field label="Phone (optional)" htmlFor="lg-phone">
            <TextInput id="lg-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </Field>
          <Field label="Website (optional)" htmlFor="lg-website">
            <TextInput id="lg-website" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="e.g. example.com" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Description" htmlFor="lg-description" required>
            <TextArea id="lg-description" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What families should know about this one." />
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button type="button" variant="primary" onClick={save} disabled={!canSave || saving}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add entry'}
          </Button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-xs font-semibold text-ink-soft hover:underline">
              Cancel
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
      </div>

      <div className="flex flex-col gap-6">
        {byCategory.map((group) => (
          <div key={group.category}>
            <h3 className="font-display text-base font-semibold text-ink">{group.label}</h3>
            <div className="mt-2 flex flex-col gap-2">
              {group.items.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-3 rounded-md border border-sand-line bg-paper p-4 text-sm">
                  <div>
                    <p className="font-semibold text-ink">
                      {e.title}
                      {!e.is_active && <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-xs font-bold text-ink-soft">Hidden</span>}
                    </p>
                    <p className="mt-1 text-ink-soft">{e.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <button type="button" onClick={() => startEdit(e)} className="text-xs font-semibold text-teal-deep hover:underline">Edit</button>
                    <button type="button" onClick={() => toggleActive(e)} className="text-xs font-semibold text-teal-deep hover:underline">{e.is_active ? 'Hide' : 'Show'}</button>
                    <button type="button" onClick={() => remove(e.id)} className="text-xs font-semibold text-orange-deep hover:underline">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {entries.length === 0 && <p className="text-sm text-ink-soft">No entries yet.</p>}
      </div>
    </div>
  );
}
