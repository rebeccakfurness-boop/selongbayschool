'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';

export default function AddLibraryDiscountCodeForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercent, setDiscountPercent] = useState('100');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/library/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          description,
          discountPercent: Number(discountPercent),
          maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
          expiresAt: expiresAt || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not create this code.');
      setOpen(false);
      setCode('');
      setDescription('');
      setDiscountPercent('100');
      setMaxRedemptions('');
      setExpiresAt('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create this code.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="primary" onClick={() => setOpen(true)}>
        Add discount code
      </Button>
    );
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold text-ink">New discount code</h2>
      <p className="mt-1 text-xs text-ink-soft">For long-term families — set 100% for free access, or any other percentage off.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Code" htmlFor="dc-code" required>
          <TextInput id="dc-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="LONGTIME2026" />
        </Field>
        <Field label="Discount %" htmlFor="dc-percent" required>
          <TextInput id="dc-percent" type="number" min={1} max={100} value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
        </Field>
        <Field label="Description" htmlFor="dc-description">
          <TextInput id="dc-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. 5+ years at the school" />
        </Field>
        <Field label="Max uses (optional)" htmlFor="dc-max">
          <TextInput id="dc-max" type="number" min={1} value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} />
        </Field>
        <Field label="Expires (optional)" htmlFor="dc-expires">
          <TextInput id="dc-expires" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </Field>
      </div>
      {error && <p role="alert" className="mt-4 font-semibold text-orange-deep">{error}</p>}
      <div className="mt-4 flex gap-3">
        <Button type="button" variant="primary" onClick={submit} disabled={saving || !code.trim()}>
          {saving ? 'Creating…' : 'Create code'}
        </Button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm font-semibold text-ink-soft underline">
          Cancel
        </button>
      </div>
    </div>
  );
}
