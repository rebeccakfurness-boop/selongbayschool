'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { formatDate } from '@/lib/admin-format';
import { formatBudgetIDR } from '@/lib/budget-shared';
import { RESOURCE_REQUEST_STATUS_LABELS, type AdminResourceRequestRow, type ResourceRequestStatus } from '@/lib/resource-requests';

const STATUS_CLASS: Record<ResourceRequestStatus, string> = {
  pending: 'bg-orange/15 text-orange-deep',
  approved: 'bg-lightteal/20 text-teal-deep',
  rejected: 'bg-ink/10 text-ink-soft',
  reimbursed: 'bg-teal/15 text-teal-deep',
};

function Row({ item }: { item: AdminResourceRequestRow }) {
  const router = useRouter();
  const [notes, setNotes] = useState(item.admin_notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(patch: { status?: 'approved' | 'rejected'; adminNotes?: string }) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/resource-requests/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save that.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that.');
    } finally {
      setSaving(false);
    }
  }

  async function reimburse() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/resource-requests/${item.id}/reimburse`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not mark that reimbursed.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not mark that reimbursed.');
    } finally {
      setSaving(false);
    }
  }

  const canDecide = item.status === 'pending' || item.status === 'approved' || item.status === 'rejected';
  const canReimburse = item.status === 'approved' && Boolean(item.receipt_url);

  return (
    <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-base font-semibold text-ink">{item.item_description}</p>
          <p className="text-sm text-ink-soft">
            {item.requester_name || item.requester_email} <span className="text-xs">({item.requester_email})</span>
          </p>
          <p className="text-xs text-ink-soft">
            Submitted {formatDate(item.created_at.slice(0, 10))}
            {item.amount_idr ? ` · ${formatBudgetIDR(item.amount_idr)}` : ''}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASS[item.status]}`}>
          {RESOURCE_REQUEST_STATUS_LABELS[item.status]}
        </span>
      </div>

      {item.reason && (
        <p className="mt-3 text-sm text-ink">
          <span className="font-semibold text-ink-soft">Reason: </span>
          {item.reason}
        </p>
      )}

      <p className="mt-2 text-sm">
        {item.receipt_url ? (
          <a href={item.receipt_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep hover:underline">
            View receipt / invoice
          </a>
        ) : (
          <span className="text-ink-soft">No receipt on file yet.</span>
        )}
      </p>

      {item.decided_at && (
        <p className="mt-1 text-xs text-ink-soft">
          Decided by {item.decided_by_name || 'an admin'} on {formatDate(item.decided_at.slice(0, 10))}
        </p>
      )}
      {item.reimbursed_at && (
        <p className="mt-1 text-xs text-ink-soft">
          Reimbursed by {item.reimbursed_by_name || 'an admin'} on {formatDate(item.reimbursed_at.slice(0, 10))}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-sand-line pt-4">
        <div className="min-w-[240px] flex-1">
          <label htmlFor={`notes-${item.id}`} className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
            Office notes
          </label>
          <textarea
            id={`notes-${item.id}`}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => decide({ adminNotes: notes })}
            className="mt-1 w-full rounded-sm border border-sand-line bg-white px-3 py-1.5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {canDecide && item.status !== 'approved' && (
            <Button type="button" variant="primary" onClick={() => decide({ status: 'approved' })} disabled={saving} className="!px-4 !py-1.5 !text-sm">
              Approve
            </Button>
          )}
          {canDecide && item.status !== 'rejected' && (
            <button
              type="button"
              onClick={() => decide({ status: 'rejected' })}
              disabled={saving}
              className="rounded-full border border-orange-deep/40 px-4 py-1.5 text-sm font-semibold text-orange-deep hover:bg-orange/10 disabled:opacity-40"
            >
              Reject
            </button>
          )}
          {item.status === 'approved' && (
            <button
              type="button"
              onClick={reimburse}
              disabled={saving || !canReimburse}
              title={canReimburse ? undefined : 'Needs a receipt or invoice on file first'}
              className="rounded-full bg-teal px-4 py-1.5 text-sm font-bold text-white hover:bg-teal-deep disabled:opacity-40"
            >
              Mark reimbursed
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}

export default function ResourceRequestsManager({ initial }: { initial: AdminResourceRequestRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      {initial.map((item) => (
        <Row key={item.id} item={item} />
      ))}
      {initial.length === 0 && (
        <div className="rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft">
          No resource or reimbursement requests yet.
        </div>
      )}
    </div>
  );
}
