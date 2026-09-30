'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { formatIDR } from '@/lib/site-content';
import type { CcaSelectionRow } from '@/lib/cca';

export default function CcaSelectionReview({ childId, selection }: { childId: number; selection: CcaSelectionRow }) {
  const router = useRouter();
  const [items, setItems] = useState(selection.items);
  const [toggling, setToggling] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleExcluded(itemId: number, excluded: boolean) {
    setToggling(itemId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cca/selection-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excluded }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, excluded_at_invoicing: excluded } : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setToggling(null);
    }
  }

  async function createInvoice() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cca/selections/${selection.id}/create-invoice`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');
      router.push(`/admin/families/${childId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
      setCreating(false);
    }
  }

  if (selection.status === 'invoiced') {
    return (
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <p className="font-semibold text-teal-deep">Already invoiced.</p>
        {selection.invoice_id != null && (
          <a href={`/api/invoices/${selection.invoice_id}/pdf`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-teal-deep underline">
            View invoice
          </a>
        )}
      </div>
    );
  }

  const total = items.filter((i) => !i.excluded_at_invoicing).reduce((sum, i) => sum + i.price_idr, 0);
  const anyBillable = items.some((i) => !i.excluded_at_invoicing);

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const belowMinimum = item.min_students != null && (item.enrollment_count ?? 0) < item.min_students;
          return (
            <li key={item.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-sm border border-sand-line px-4 py-3 ${item.excluded_at_invoicing ? 'opacity-50' : ''}`}>
              <div>
                <div className="font-semibold text-ink">
                  {item.cca_name}
                  {item.option_name && <span className="text-ink-soft"> — {item.option_name}</span>}
                </div>
                {belowMinimum && (
                  <div className="mt-1 inline-block rounded-full bg-orange/20 px-2 py-0.5 text-xs font-bold text-orange-deep">
                    {item.enrollment_count} of {item.min_students} needed
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-ink">{formatIDR(item.price_idr)}</span>
                <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
                  <input
                    type="checkbox"
                    checked={item.excluded_at_invoicing}
                    disabled={toggling === item.id}
                    onChange={(e) => toggleExcluded(item.id, e.target.checked)}
                    className="h-4 w-4"
                  />
                  Exclude
                </label>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-sand-line pt-4">
        <span className="font-display text-lg font-semibold text-ink">Total: {formatIDR(total)}</span>
        <Button type="button" variant="primary" onClick={createInvoice} disabled={creating || !anyBillable}>
          {creating ? 'Creating…' : 'Create invoice'}
        </Button>
      </div>
      {!anyBillable && <p className="mt-2 text-xs font-semibold text-orange-deep">Every item is excluded — nothing to invoice.</p>}
      {error && <p role="alert" className="mt-2 font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
