'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatIDR } from '@/lib/site-content';

export interface CreditNoteApplicationSummary {
  id: number;
  invoice_number: number;
  amount_idr: number;
  applied_at: string;
}

export interface CreditNoteSummary {
  id: number;
  credit_note_number: number;
  kind: 'refund' | 'credit_hold';
  reason: string;
  amount_idr: number;
  remaining_idr: number;
  status: 'open' | 'applied' | 'refunded' | 'cancelled';
  issued_at: string;
  applications: CreditNoteApplicationSummary[];
}

export interface OutstandingInvoiceOption {
  id: number;
  invoiceNumber: number;
  amountDue: number;
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-orange/20 text-orange-deep',
  applied: 'bg-teal/15 text-teal-deep',
  refunded: 'bg-teal/15 text-teal-deep',
  cancelled: 'bg-black/10 text-ink-soft',
};

const KIND_LABELS: Record<string, string> = {
  refund: 'Refund',
  credit_hold: 'Credit hold',
};

export default function CreditNotesSection({
  childId,
  creditNotes,
  outstandingInvoices,
  canEdit,
}: {
  childId: number;
  creditNotes: CreditNoteSummary[];
  outstandingInvoices: OutstandingInvoiceOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [applyPickerId, setApplyPickerId] = useState<number | null>(null);
  const [applyInvoiceId, setApplyInvoiceId] = useState('');
  const [applyAmount, setApplyAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function runAction(id: number, action: 'mark_refunded' | 'cancel') {
    if (action === 'cancel' && !window.confirm('Cancel this credit note? Any remaining, unused balance will be written off.')) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/credit-notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update credit note');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update credit note');
    } finally {
      setBusyId(null);
    }
  }

  function openApplyPicker(cn: CreditNoteSummary) {
    setApplyPickerId(cn.id);
    setApplyInvoiceId('');
    setApplyAmount(String(cn.remaining_idr));
    setError(null);
  }

  async function submitApply(creditNoteId: number) {
    const invoiceId = Number(applyInvoiceId);
    const amount = Number(applyAmount);
    if (!invoiceId || !amount || amount <= 0) {
      setError('Pick an invoice and enter an amount greater than zero.');
      return;
    }
    setBusyId(creditNoteId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/credit-notes/${creditNoteId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, amountIdr: amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to apply credit note');
      setApplyPickerId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply credit note');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">Credit Notes</h3>
        {canEdit && (
          <Link href={`/admin/families/${childId}/credit-notes/new`} className="text-sm font-semibold text-teal-deep hover:underline">
            + Credit note
          </Link>
        )}
      </div>

      {error && <p role="alert" className="mt-2 text-sm font-semibold text-orange-deep">{error}</p>}

      <ul className="mt-3 flex flex-col gap-2">
        {creditNotes.map((cn) => (
          <li key={cn.id} className="flex flex-col gap-2 rounded-sm border border-sand-line px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <a href={`/api/credit-notes/${cn.id}/pdf`} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
                  Credit Note #{String(cn.credit_note_number).padStart(3, '0')}
                </a>
                <span className="ml-2 text-xs text-ink-soft">{KIND_LABELS[cn.kind]}</span>
              </div>
              <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold capitalize ${STATUS_STYLES[cn.status]}`}>{cn.status}</span>
            </div>

            <p className="text-ink-soft">
              {cn.kind === 'credit_hold' && cn.remaining_idr !== cn.amount_idr ? (
                <>
                  <span className="font-semibold text-ink">{formatIDR(cn.remaining_idr)}</span> remaining of {formatIDR(cn.amount_idr)}
                </>
              ) : (
                <span className="font-semibold text-ink">{formatIDR(cn.amount_idr)}</span>
              )}
            </p>
            <p className="text-ink-soft">{cn.reason}</p>

            {cn.applications.length > 0 && (
              <ul className="flex flex-col gap-0.5 text-xs text-ink-soft">
                {cn.applications.map((a) => (
                  <li key={a.id}>
                    Applied {formatIDR(a.amount_idr)} to invoice #{String(a.invoice_number).padStart(3, '0')}
                  </li>
                ))}
              </ul>
            )}

            {canEdit && cn.status === 'open' && (
              <div className="flex flex-wrap items-center gap-3 border-t border-sand-line/70 pt-2">
                {cn.kind === 'refund' && (
                  <button
                    type="button"
                    onClick={() => runAction(cn.id, 'mark_refunded')}
                    disabled={busyId === cn.id}
                    className="text-xs font-semibold text-teal-deep hover:underline disabled:opacity-50"
                  >
                    Mark refunded
                  </button>
                )}
                {cn.kind === 'credit_hold' && cn.remaining_idr > 0 && applyPickerId !== cn.id && (
                  <button
                    type="button"
                    onClick={() => openApplyPicker(cn)}
                    disabled={busyId === cn.id || outstandingInvoices.length === 0}
                    className="text-xs font-semibold text-teal-deep hover:underline disabled:opacity-50"
                    title={outstandingInvoices.length === 0 ? 'No outstanding invoices to apply this to' : undefined}
                  >
                    Apply to invoice
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => runAction(cn.id, 'cancel')}
                  disabled={busyId === cn.id}
                  className="text-xs font-semibold text-orange-deep hover:underline disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}

            {applyPickerId === cn.id && (
              <div className="flex flex-wrap items-end gap-2 border-t border-sand-line/70 pt-2">
                <select
                  value={applyInvoiceId}
                  onChange={(e) => setApplyInvoiceId(e.target.value)}
                  className="rounded-sm border border-sand-line bg-white px-2 py-1.5 text-sm text-ink"
                >
                  <option value="">Choose invoice…</option>
                  {outstandingInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      #{String(inv.invoiceNumber).padStart(3, '0')} — due {formatIDR(inv.amountDue)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  step={1000}
                  value={applyAmount}
                  onChange={(e) => setApplyAmount(e.target.value)}
                  className="w-32 rounded-sm border border-sand-line bg-white px-2 py-1.5 text-sm text-ink"
                />
                <button
                  type="button"
                  onClick={() => submitApply(cn.id)}
                  disabled={busyId === cn.id}
                  className="rounded-sm bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-deep disabled:opacity-50"
                >
                  {busyId === cn.id ? 'Applying…' : 'Apply'}
                </button>
                <button type="button" onClick={() => setApplyPickerId(null)} className="text-xs font-semibold text-ink-soft hover:underline">
                  Cancel
                </button>
              </div>
            )}
          </li>
        ))}
        {creditNotes.length === 0 && <li className="text-sm text-ink-soft">No credit notes yet.</li>}
      </ul>
    </div>
  );
}
