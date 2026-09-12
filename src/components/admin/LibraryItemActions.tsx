'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const selectClasses = 'rounded-sm border border-sand-line bg-white px-2.5 py-1.5 text-sm text-ink';

export default function LibraryItemActions({
  itemId,
  isActive,
  available,
  childOptions,
}: {
  itemId: number;
  isActive: boolean;
  available: boolean;
  childOptions: { id: number; label: string }[];
}) {
  const router = useRouter();
  const [checkingOut, setCheckingOut] = useState(false);
  const [childId, setChildId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    if (!childId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/library/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, childId: Number(childId), dueDate: dueDate || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not check out this item.');
      setCheckingOut(false);
      setChildId('');
      setDueDate('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check out this item.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive() {
    setBusy(true);
    try {
      await fetch(`/api/admin/library/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm('Remove this item from the catalogue?')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/library/items/${itemId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not remove this item.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove this item.');
      setBusy(false);
    }
  }

  if (checkingOut) {
    return (
      <div className="flex flex-col gap-2 rounded-sm border border-sand-line bg-sand/30 p-3">
        <select value={childId} onChange={(e) => setChildId(e.target.value)} className={selectClasses}>
          <option value="">Borrower…</option>
          {childOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={selectClasses}
          placeholder="Due date (optional)"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={checkout}
            disabled={busy || !childId}
            className="rounded-full bg-teal px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy ? 'Checking out…' : 'Confirm'}
          </button>
          <button type="button" onClick={() => setCheckingOut(false)} className="text-xs font-semibold text-ink-soft underline">
            Cancel
          </button>
        </div>
        {error && <p className="text-xs font-semibold text-orange-deep">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => setCheckingOut(true)}
        disabled={!isActive || !available}
        className="whitespace-nowrap rounded-full bg-orange-deep px-3 py-1 text-xs font-bold text-white hover:bg-orange disabled:opacity-40"
      >
        Check out
      </button>
      <button type="button" onClick={toggleActive} disabled={busy} className="text-xs font-semibold text-teal-deep hover:underline disabled:opacity-50">
        {isActive ? 'Deactivate' : 'Reactivate'}
      </button>
      <button type="button" onClick={remove} disabled={busy} className="text-xs font-semibold text-ink-soft hover:text-orange-deep hover:underline disabled:opacity-50">
        Remove
      </button>
      {error && <p className="text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
