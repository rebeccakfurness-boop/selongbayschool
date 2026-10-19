'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';

interface InvoiceOption {
  id: number;
  invoiceNumber: number;
  invoiceType: string;
}

export default function CreditNoteForm({
  childId,
  childLabel,
  invoiceOptions,
  redirectTo,
}: {
  childId: number;
  childLabel: string;
  invoiceOptions: InvoiceOption[];
  redirectTo: string;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<'refund' | 'credit_hold'>('refund');
  const [amountIdr, setAmountIdr] = useState('');
  const [reason, setReason] = useState('');
  const [originalInvoiceId, setOriginalInvoiceId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/credit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          kind,
          amountIdr: Number(amountIdr) || 0,
          reason,
          originalInvoiceId: originalInvoiceId ? Number(originalInvoiceId) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create credit note');
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create credit note');
    } finally {
      setSaving(false);
    }
  }

  const amountValid = Number(amountIdr) > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <p className="text-sm text-ink-soft">
          For <span className="font-semibold text-ink">{childLabel}</span>
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="What should happen to this credit?" htmlFor="cn-kind" required>
            <select
              id="cn-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as 'refund' | 'credit_hold')}
              className="rounded-sm border border-sand-line bg-white px-4 py-2.5 text-[15px] text-ink"
            >
              <option value="refund">Refund — pay the money back to the parent</option>
              <option value="credit_hold">Hold as credit — apply to a future invoice</option>
            </select>
          </Field>
          <Field label="Amount (IDR)" htmlFor="cn-amount" required>
            <TextInput id="cn-amount" type="number" min={1} step={1000} value={amountIdr} onChange={(e) => setAmountIdr(e.target.value)} placeholder="e.g. 500000" />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Relates to this invoice (optional)" htmlFor="cn-invoice">
            <select
              id="cn-invoice"
              value={originalInvoiceId}
              onChange={(e) => setOriginalInvoiceId(e.target.value)}
              className="rounded-sm border border-sand-line bg-white px-4 py-2.5 text-[15px] text-ink"
            >
              <option value="">— None —</option>
              {invoiceOptions.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  #{String(inv.invoiceNumber).padStart(3, '0')} ({inv.invoiceType})
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Reason" htmlFor="cn-reason" required>
            <TextArea id="cn-reason" required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why this credit is being issued…" />
          </Field>
        </div>
      </div>

      {error && <p role="alert" className="font-semibold text-orange-deep">{error}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="primary" onClick={submit} disabled={saving || !amountValid || !reason.trim()}>
          {saving ? 'Creating…' : 'Issue credit note'}
        </Button>
        <Button href={redirectTo} variant="ghost">
          Cancel
        </Button>
      </div>
    </div>
  );
}
