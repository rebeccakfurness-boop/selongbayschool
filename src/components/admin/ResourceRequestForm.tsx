'use client';

import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import Button from '@/components/Button';
import FormStatusBanner from '@/components/forms/FormStatusBanner';
import { useFormSubmit } from '@/lib/useFormSubmit';
import { formatDate } from '@/lib/admin-format';
import { formatBudgetIDR } from '@/lib/budget-shared';
import { RESOURCE_REQUEST_STATUS_LABELS, type ResourceRequestRow, type ResourceRequestStatus } from '@/lib/resource-requests';

const STATUS_CLASS: Record<ResourceRequestStatus, string> = {
  pending: 'bg-orange/15 text-orange-deep',
  approved: 'bg-lightteal/20 text-teal-deep',
  rejected: 'bg-ink/10 text-ink-soft',
  reimbursed: 'bg-teal/15 text-teal-deep',
};

function ReceiptAttach({ item, onSaved }: { item: ResourceRequestRow; onSaved: (patch: { receiptUrl: string; amountIdr: number | null }) => void }) {
  const [amount, setAmount] = useState(item.amount_idr ? String(item.amount_idr) : '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await upload(`resource-requests/${item.id}/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/resource-requests/upload',
      });
      const amountIdr = amount ? Number(amount) : null;
      const res = await fetch(`/api/admin/resource-requests/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptUrl: blob.url, amountIdr }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not attach that receipt.');
      onSaved({ receiptUrl: blob.url, amountIdr });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not attach that receipt.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-end gap-3 rounded-sm border border-dashed border-sand-line p-3">
      <div className="w-32">
        <label htmlFor={`amount-${item.id}`} className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
          Amount (IDR)
        </label>
        <input
          id={`amount-${item.id}`}
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-sm border border-sand-line px-2 py-1.5 text-sm"
        />
      </div>
      <label className="cursor-pointer text-sm font-semibold text-teal-deep hover:underline">
        {uploading ? 'Uploading…' : item.receipt_url ? 'Replace receipt / invoice' : 'Upload receipt / invoice'}
        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={handleFile} disabled={uploading} className="hidden" />
      </label>
      {item.receipt_url && (
        <a href={item.receipt_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-ink-soft hover:underline">
          View current
        </a>
      )}
      {error && <p className="w-full text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}

function RequestItem({ item, onUpdate, onWithdraw }: {
  item: ResourceRequestRow;
  onUpdate: (id: number, patch: { receiptUrl: string; amountIdr: number | null }) => void;
  onWithdraw: (id: number) => void;
}) {
  const canAttachReceipt = item.status === 'pending' || item.status === 'approved';
  const canWithdraw = item.status === 'pending';

  return (
    <li className="rounded-md border border-sand-line bg-paper p-4 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-ink">{item.item_description}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASS[item.status]}`}>
          {RESOURCE_REQUEST_STATUS_LABELS[item.status]}
        </span>
      </div>
      {item.reason && <p className="mt-2 text-sm text-ink-soft">{item.reason}</p>}
      <p className="mt-2 text-xs text-ink-soft">
        Submitted {formatDate(item.created_at.slice(0, 10))}
        {item.amount_idr ? ` · ${formatBudgetIDR(item.amount_idr)}` : ''}
        {item.receipt_url ? ' · Receipt on file' : ''}
      </p>
      {item.admin_notes && (
        <p className="mt-2 rounded-sm bg-sand/30 px-3 py-2 text-sm text-ink">
          <span className="font-semibold">Office note:</span> {item.admin_notes}
        </p>
      )}
      {canAttachReceipt && (
        <ReceiptAttach item={item} onSaved={(patch) => onUpdate(item.id, patch)} />
      )}
      {canWithdraw && (
        <button type="button" onClick={() => onWithdraw(item.id)} className="mt-3 text-xs font-semibold text-orange-deep hover:underline">
          Withdraw request
        </button>
      )}
    </li>
  );
}

export default function ResourceRequestForm({ initial }: { initial: ResourceRequestRow[] }) {
  const [history, setHistory] = useState(initial);
  const [itemDescription, setItemDescription] = useState('');
  const [reason, setReason] = useState('');
  const [amountIdr, setAmountIdr] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { status, errorMessage, submit, reset } = useFormSubmit<{ id: number; created_at: string }>('/api/admin/resource-requests');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const blob = await upload(`resource-requests/new/${Date.now()}-${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/resource-requests/upload',
      });
      setReceiptUrl(blob.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not upload that file.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemDescription.trim()) return;
    const result = await submit({
      itemDescription: itemDescription.trim(),
      reason: reason.trim() || null,
      amountIdr: amountIdr ? Number(amountIdr) : null,
      receiptUrl,
    });
    if (result) {
      setHistory((prev) => [
        {
          id: result.id,
          item_description: itemDescription.trim(),
          reason: reason.trim() || null,
          amount_idr: amountIdr ? Number(amountIdr) : null,
          receipt_url: receiptUrl,
          status: 'pending',
          admin_notes: null,
          decided_at: null,
          reimbursed_at: null,
          created_at: result.created_at,
        },
        ...prev,
      ]);
      setItemDescription('');
      setReason('');
      setAmountIdr('');
      setReceiptUrl(null);
    }
  }

  function handleUpdate(id: number, patch: { receiptUrl: string; amountIdr: number | null }) {
    setHistory((prev) => prev.map((r) => (r.id === id ? { ...r, receipt_url: patch.receiptUrl, amount_idr: patch.amountIdr ?? r.amount_idr } : r)));
  }

  async function handleWithdraw(id: number) {
    setHistory((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/admin/resource-requests/${id}`, { method: 'DELETE' });
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Request a resource or purchase</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Ask for approval to buy something, or — if you&apos;ve already bought it — attach the receipt now and
          request approval and reimbursement together.
        </p>

        <div className="mt-5">
          <Field label="What do you need?" htmlFor="rr-item" required>
            <TextInput
              id="rr-item"
              required
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              placeholder="e.g. Whiteboard markers, classroom storage bins, art supplies"
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Reason / justification (optional)" htmlFor="rr-reason">
            <TextArea
              id="rr-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What it's for and why it's needed"
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Estimated / actual cost, IDR (optional)" htmlFor="rr-amount">
            <input
              id="rr-amount"
              type="number"
              min={0}
              value={amountIdr}
              onChange={(e) => setAmountIdr(e.target.value)}
              className="w-full rounded-sm border border-sand-line bg-white px-4 py-2.5 text-[15px] text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </Field>
          <div>
            <label className="block text-sm font-semibold text-ink">Receipt / invoice (optional)</label>
            <label className="mt-1.5 flex w-full cursor-pointer items-center justify-center rounded-sm border border-sand-line bg-white px-4 py-2.5 text-sm font-semibold text-teal-deep hover:border-teal">
              {uploading ? 'Uploading…' : receiptUrl ? 'Uploaded ✓ — replace' : 'Choose a file'}
              <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={handleFile} disabled={uploading} className="hidden" />
            </label>
            {uploadError && <p className="mt-1 text-xs font-semibold text-orange-deep">{uploadError}</p>}
          </div>
        </div>

        <div className="mt-5">
          <FormStatusBanner status={status} errorMessage={errorMessage} successMessage="Request submitted — the school office will review it." />
        </div>
        <div className="mt-4">
          <Button type="submit" variant="primary" disabled={status === 'submitting' || !itemDescription.trim()}>
            {status === 'submitting' ? 'Submitting…' : 'Submit request'}
          </Button>
          {status === 'error' && (
            <button type="button" onClick={reset} className="ml-3 text-sm font-semibold text-ink-soft hover:underline">
              Dismiss
            </button>
          )}
        </div>
      </form>

      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Requests you&apos;ve submitted</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Nothing submitted yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {history.map((item) => (
              <RequestItem key={item.id} item={item} onUpdate={handleUpdate} onWithdraw={handleWithdraw} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
