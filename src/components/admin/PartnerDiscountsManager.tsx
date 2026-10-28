'use client';

import { useState } from 'react';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import Button from '@/components/Button';

const UPLOAD_ENDPOINT = '/api/admin/partner-discounts';

export interface PartnerDiscountItem {
  id: number;
  business_name: string;
  category: 'restaurant' | 'activity' | 'other';
  discount_description: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  is_active: boolean;
}

const CATEGORY_LABEL: Record<PartnerDiscountItem['category'], string> = { restaurant: 'Restaurant', activity: 'Activity', other: 'Other' };

const emptyForm = { businessName: '', category: 'restaurant' as PartnerDiscountItem['category'], discountDescription: '', address: '', phone: '', website: '', isActive: true };

/** Admin-only directory of local restaurant/activity discounts shown on the parent portal's
 * Selong Families Discount page. Same compose-form-plus-list shape as the other admin feed/list
 * managers in this app. */
export default function PartnerDiscountsManager({ initial }: { initial: PartnerDiscountItem[] }) {
  const [discounts, setDiscounts] = useState(initial);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(UPLOAD_ENDPOINT);
    const data = await res.json().catch(() => ({}));
    if (res.ok) setDiscounts(data.discounts);
  }

  function startEdit(d: PartnerDiscountItem) {
    setEditingId(d.id);
    setForm({
      businessName: d.business_name,
      category: d.category,
      discountDescription: d.discount_description,
      address: d.address ?? '',
      phone: d.phone ?? '',
      website: d.website ?? '',
      isActive: d.is_active,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  const canSave = form.businessName.trim() && form.discountDescription.trim();

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(editingId ? `${UPLOAD_ENDPOINT}/${editingId}` : UPLOAD_ENDPOINT, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save that discount.');
      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that discount.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    setDiscounts((prev) => prev.filter((d) => d.id !== id));
    await fetch(`${UPLOAD_ENDPOINT}/${id}`, { method: 'DELETE' });
  }

  async function toggleActive(d: PartnerDiscountItem) {
    await fetch(`${UPLOAD_ENDPOINT}/${d.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: d.business_name,
        category: d.category,
        discountDescription: d.discount_description,
        address: d.address ?? '',
        phone: d.phone ?? '',
        website: d.website ?? '',
        isActive: !d.is_active,
      }),
    });
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">{editingId ? 'Edit discount' : 'Add a partner discount'}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Business name" htmlFor="pd-name" required>
            <TextInput id="pd-name" value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} placeholder="e.g. Warung Pantai" />
          </Field>
          <Field label="Category" htmlFor="pd-category">
            <select
              id="pd-category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as PartnerDiscountItem['category'] }))}
              className="w-full rounded-sm border border-sand-line bg-white px-3 py-2 text-sm"
            >
              <option value="restaurant">Restaurant</option>
              <option value="activity">Activity</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Address (optional)" htmlFor="pd-address">
            <TextInput id="pd-address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </Field>
          <Field label="Phone (optional)" htmlFor="pd-phone">
            <TextInput id="pd-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </Field>
          <Field label="Website (optional)" htmlFor="pd-website">
            <TextInput id="pd-website" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="e.g. example.com" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Discount" htmlFor="pd-discount" required>
            <TextArea id="pd-discount" rows={2} value={form.discountDescription} onChange={(e) => setForm((f) => ({ ...f, discountDescription: e.target.value }))} placeholder="e.g. 15% off for Selong Bay School families" />
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button type="button" variant="primary" onClick={save} disabled={!canSave || saving}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add discount'}
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
        {discounts.map((d) => (
          <div key={d.id} className="flex items-start justify-between gap-3 rounded-md border border-sand-line bg-paper p-4 text-sm">
            <div>
              <p className="font-semibold text-ink">
                {d.business_name} <span className="font-normal text-ink-soft">· {CATEGORY_LABEL[d.category]}</span>
                {!d.is_active && <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-xs font-bold text-ink-soft">Hidden</span>}
              </p>
              <p className="mt-1 text-ink-soft">{d.discount_description}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <button type="button" onClick={() => startEdit(d)} className="text-xs font-semibold text-teal-deep hover:underline">Edit</button>
              <button type="button" onClick={() => toggleActive(d)} className="text-xs font-semibold text-teal-deep hover:underline">{d.is_active ? 'Hide' : 'Show'}</button>
              <button type="button" onClick={() => remove(d.id)} className="text-xs font-semibold text-orange-deep hover:underline">Remove</button>
            </div>
          </div>
        ))}
        {discounts.length === 0 && <p className="text-sm text-ink-soft">No partner discounts yet.</p>}
      </div>
    </div>
  );
}
