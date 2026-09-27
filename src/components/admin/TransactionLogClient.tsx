'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { formatBudgetIDR } from '@/lib/budget-shared';
import { formatDate } from '@/lib/admin-format';
import type { CombinedTransaction } from '@/lib/budget';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/forms/FormField';
import ReceiptUploadField from '@/components/admin/ReceiptUploadField';

const METHOD_LABELS: Record<string, string> = { bank_transfer: 'Bank Transfer', cash: 'Cash' };

function matches(t: CombinedTransaction, query: string): boolean {
  const q = query.toLowerCase();
  if (t.kind === 'revenue') {
    return t.payer_source.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q);
  }
  return (
    t.vendor_description.toLowerCase().includes(q) ||
    t.category_name.toLowerCase().includes(q) ||
    t.authorized_by.toLowerCase().includes(q)
  );
}

interface MatchableInvoice {
  id: number;
  invoice_number: number;
  billed_to_name: string;
  total_amount: number;
  due_date: string;
  invoice_type: string;
}

/** "Match to invoice" -- the Xero-style reconciliation step. Opened only for an unmatched revenue
 * entry; picking an invoice here marks it paid server-side in the same action (see
 * matchRevenueToInvoice in budget.ts), not a separate manual step that could drift out of sync. */
function MatchInvoiceModal({
  entry,
  onClose,
  onMatched,
}: {
  entry: Extract<CombinedTransaction, { kind: 'revenue' }>;
  onClose: () => void;
  onMatched: () => void;
}) {
  const [query, setQuery] = useState('');
  const [invoices, setInvoices] = useState<MatchableInvoice[] | null>(null);
  const [matchingId, setMatchingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ amount: String(entry.amount_idr) });
    if (query.trim()) params.set('query', query.trim());
    fetch(`/api/admin/budget/match-invoices?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setInvoices(data.invoices ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [query, entry.amount_idr]);

  async function pick(invoiceId: number) {
    setMatchingId(invoiceId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/budget/revenue/${entry.id}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not match this entry.');
      onMatched();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not match this entry.');
      setMatchingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-md border border-sand-line bg-paper p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-semibold text-ink">Match to invoice</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {entry.payer_source} &middot; {formatBudgetIDR(entry.amount_idr)} on {formatDate(entry.entry_date)}
        </p>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search billed-to name or invoice number…"
          autoFocus
          className="mt-4 w-full rounded-sm border border-sand-line px-4 py-2.5 text-base text-ink"
        />

        {error && <p className="mt-3 text-sm font-semibold text-orange-deep">{error}</p>}

        <div className="mt-4 flex flex-col gap-2">
          {invoices === null && <p className="text-sm text-ink-soft">Loading…</p>}
          {invoices?.length === 0 && <p className="text-sm text-ink-soft">No outstanding invoices match.</p>}
          {invoices?.map((inv) => {
            const exactAmount = inv.total_amount === entry.amount_idr;
            return (
              <button
                key={inv.id}
                type="button"
                disabled={matchingId !== null}
                onClick={() => pick(inv.id)}
                className={`flex items-center justify-between gap-3 rounded-sm border p-3 text-left text-sm hover:bg-sand/20 disabled:opacity-60 ${
                  exactAmount ? 'border-teal/50 bg-teal/5' : 'border-sand-line'
                }`}
              >
                <div>
                  <p className="font-semibold text-ink">
                    #{inv.invoice_number} &middot; {inv.billed_to_name}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {inv.invoice_type} &middot; due {formatDate(inv.due_date)}
                    {exactAmount && <span className="ml-1 font-bold text-teal-deep">&middot; Amount matches</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums text-ink">{formatBudgetIDR(inv.total_amount)}</span>
                  <span className="text-xs font-bold text-teal-deep">{matchingId === inv.id ? 'Matching…' : 'Match'}</span>
                </div>
              </button>
            );
          })}
        </div>

        <button type="button" onClick={onClose} className="mt-5 text-sm font-semibold text-ink-soft hover:underline">
          Cancel
        </button>
      </div>
    </div>
  );
}

interface EditFormState {
  entryDate: string;
  amountIdr: string;
  // revenue
  payerSource: string;
  description: string;
  paymentMethod: 'bank_transfer' | 'cash';
  // expense
  categoryId: number | '';
  vendorDescription: string;
  authorizedBy: string;
  receiptUrl: string | null;
}

function toEditFormState(t: CombinedTransaction): EditFormState {
  if (t.kind === 'revenue') {
    return {
      entryDate: t.entry_date,
      amountIdr: String(t.amount_idr),
      payerSource: t.payer_source,
      description: t.description ?? '',
      paymentMethod: t.payment_method,
      categoryId: '',
      vendorDescription: '',
      authorizedBy: '',
      receiptUrl: t.receipt_url,
    };
  }
  return {
    entryDate: t.entry_date,
    amountIdr: String(t.amount_idr),
    payerSource: '',
    description: '',
    paymentMethod: 'bank_transfer',
    categoryId: t.category_id,
    vendorDescription: t.vendor_description,
    authorizedBy: t.authorized_by,
    receiptUrl: t.receipt_url,
  };
}

/** Corrects a transaction that was coded wrongly the first time -- same fields as the one-off Log
 * Revenue / Log Expense forms, just reachable from the Transaction Log itself once an entry is
 * already on record, and PATCHing instead of POSTing. */
function EditTransactionModal({
  transaction,
  categories,
  onClose,
  onSaved,
}: {
  transaction: CombinedTransaction;
  categories: { id: number; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EditFormState>(() => toEditFormState(transaction));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof EditFormState>(key: K, value: EditFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const endpoint =
        transaction.kind === 'revenue'
          ? `/api/admin/budget/revenue/${transaction.id}`
          : `/api/admin/budget/expenses/${transaction.id}`;
      const body =
        transaction.kind === 'revenue'
          ? {
              entryDate: form.entryDate,
              amountIdr: form.amountIdr,
              payerSource: form.payerSource,
              description: form.description || null,
              paymentMethod: form.paymentMethod,
              receiptUrl: form.receiptUrl,
            }
          : {
              entryDate: form.entryDate,
              amountIdr: form.amountIdr,
              categoryId: form.categoryId,
              vendorDescription: form.vendorDescription,
              authorizedBy: form.authorizedBy,
              receiptUrl: form.receiptUrl,
            };
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save changes.');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-md border border-sand-line bg-paper p-6 shadow-soft"
        noValidate
      >
        <h2 className="font-display text-lg font-semibold text-ink">
          Edit {transaction.kind === 'revenue' ? 'revenue' : 'expense'} entry
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Date" htmlFor="edit-tx-date" required>
            <TextInput id="edit-tx-date" type="date" required value={form.entryDate} onChange={(e) => set('entryDate', e.target.value)} />
          </Field>
          <Field label="Amount (IDR)" htmlFor="edit-tx-amount" required>
            <TextInput
              id="edit-tx-amount"
              type="number"
              inputMode="numeric"
              min="1"
              required
              value={form.amountIdr}
              onChange={(e) => set('amountIdr', e.target.value)}
            />
          </Field>
        </div>

        {transaction.kind === 'revenue' ? (
          <>
            <div className="mt-4">
              <Field label="Payer / source" htmlFor="edit-tx-payer" required>
                <TextInput id="edit-tx-payer" required value={form.payerSource} onChange={(e) => set('payerSource', e.target.value)} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Description" htmlFor="edit-tx-description">
                <TextArea id="edit-tx-description" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
              </Field>
            </div>
            <fieldset className="mt-4">
              <legend className="mb-2 font-sans text-sm font-bold text-ink">
                Payment method <span className="text-orange-deep">*</span>
              </legend>
              <div className="grid grid-cols-2 gap-3">
                {(['bank_transfer', 'cash'] as const).map((method) => (
                  <label
                    key={method}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                      form.paymentMethod === method ? 'border-teal bg-teal/10 text-teal-deep' : 'border-sand-line bg-white text-ink-soft'
                    }`}
                  >
                    <input
                      type="radio"
                      name="edit-payment-method"
                      value={method}
                      checked={form.paymentMethod === method}
                      onChange={() => set('paymentMethod', method)}
                      className="sr-only"
                    />
                    {method === 'bank_transfer' ? 'Bank Transfer' : 'Cash'}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        ) : (
          <>
            <div className="mt-4">
              <Field label="Category" htmlFor="edit-tx-category" required>
                <select
                  id="edit-tx-category"
                  required
                  value={form.categoryId}
                  onChange={(e) => set('categoryId', Number(e.target.value))}
                  className="w-full rounded-sm border border-sand-line bg-white px-4 py-2.5 text-base text-ink"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Vendor / description" htmlFor="edit-tx-vendor" required>
                <TextInput id="edit-tx-vendor" required value={form.vendorDescription} onChange={(e) => set('vendorDescription', e.target.value)} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Authorized / spent by" htmlFor="edit-tx-authorized" required>
                <TextInput id="edit-tx-authorized" required value={form.authorizedBy} onChange={(e) => set('authorizedBy', e.target.value)} />
              </Field>
            </div>
          </>
        )}

        <div className="mt-4">
          <p className="mb-2 font-sans text-sm font-bold text-ink">Receipt</p>
          {form.receiptUrl && (
            <a href={form.receiptUrl} target="_blank" rel="noopener noreferrer" className="mb-2 block text-sm font-semibold text-teal-deep underline">
              View current receipt
            </a>
          )}
          <ReceiptUploadField onUploaded={(url) => set('receiptUrl', url ?? form.receiptUrl)} />
        </div>

        {error && <p className="mt-4 font-semibold text-orange-deep">{error}</p>}

        <div className="mt-5 flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-ink-soft hover:underline">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TransactionLogClient({
  transactions,
  categories,
}: {
  transactions: CombinedTransaction[];
  categories: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | 'revenue' | 'expense'>('all');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [editing, setEditing] = useState<CombinedTransaction | null>(null);
  const [matching, setMatching] = useState<Extract<CombinedTransaction, { kind: 'revenue' }> | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (kindFilter !== 'all' && t.kind !== kindFilter) return false;
      if (query.trim() && !matches(t, query.trim())) return false;
      return true;
    });
  }, [transactions, query, kindFilter]);

  const totalRevenue = filtered.filter((t) => t.kind === 'revenue').reduce((sum, t) => sum + t.amount_idr, 0);
  const totalExpenses = filtered.filter((t) => t.kind === 'expense').reduce((sum, t) => sum + t.amount_idr, 0);

  async function unmatch(revenueId: number) {
    if (!window.confirm('Unmatch this entry? The linked invoice will go back to outstanding.')) return;
    setRowError(null);
    try {
      const res = await fetch(`/api/admin/budget/revenue/${revenueId}/match`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not unmatch this entry.');
      router.refresh();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'Could not unmatch this entry.');
    }
  }

  async function remove(t: CombinedTransaction) {
    if (!window.confirm('Delete this transaction? This cannot be undone.')) return;
    const key = `${t.kind}-${t.id}`;
    setDeletingKey(key);
    setRowError(null);
    try {
      const endpoint = t.kind === 'revenue' ? `/api/admin/budget/revenue/${t.id}` : `/api/admin/budget/expenses/${t.id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not delete this entry.');
      router.refresh();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'Could not delete this entry.');
    } finally {
      setDeletingKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-sand-line bg-paper p-4 shadow-soft">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search payer, vendor, category…"
          className="min-w-[14rem] flex-1 rounded-sm border border-sand-line px-4 py-2.5 text-base text-ink"
        />
        <div className="flex gap-2">
          {(['all', 'revenue', 'expense'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKindFilter(k)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                kindFilter === k ? 'bg-teal text-white' : 'border border-sand-line bg-white text-ink'
              }`}
            >
              {k === 'all' ? 'All' : k === 'revenue' ? 'Revenue' : 'Expenses'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-6 rounded-md border border-sand-line bg-cream/50 px-5 py-3 text-sm">
        <span>
          <span className="font-bold text-ink-soft">Revenue shown:</span>{' '}
          <span className="font-semibold tabular-nums text-teal-deep">{formatBudgetIDR(totalRevenue)}</span>
        </span>
        <span>
          <span className="font-bold text-ink-soft">Expenses shown:</span>{' '}
          <span className="font-semibold tabular-nums text-orange-deep">{formatBudgetIDR(totalExpenses)}</span>
        </span>
        <span>
          <span className="font-bold text-ink-soft">{filtered.length}</span> <span className="text-ink-soft">entries</span>
        </span>
      </div>

      {rowError && <p className="text-sm font-semibold text-orange-deep">{rowError}</p>}

      <div className="overflow-x-auto rounded-md border border-sand-line bg-paper shadow-soft">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">Date</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Type</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Who / category</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Details</th>
              <th className="px-4 py-3 text-right font-bold text-ink-soft">Amount</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Photo</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Invoice match</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const key = `${t.kind}-${t.id}`;
              return (
                <tr key={key} className="border-b border-sand-line/60 last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(t.entry_date)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        t.kind === 'revenue' ? 'bg-teal/15 text-teal-deep' : 'bg-orange/20 text-orange-deep'
                      }`}
                    >
                      {t.kind === 'revenue' ? 'Revenue' : 'Expense'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {t.kind === 'revenue' ? t.payer_source : t.category_name}
                    {t.kind === 'revenue' && (
                      <div className="text-xs text-ink-soft">{METHOD_LABELS[t.payment_method]}</div>
                    )}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-ink-soft">
                    {t.kind === 'revenue' ? t.description || 'No description' : `${t.vendor_description} · authorized by ${t.authorized_by}`}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${
                      t.kind === 'revenue' ? 'text-teal-deep' : 'text-orange-deep'
                    }`}
                  >
                    {t.kind === 'revenue' ? '+' : '−'}
                    {formatBudgetIDR(t.amount_idr)}
                  </td>
                  <td className="px-4 py-3">
                    {t.receipt_url ? (
                      <button type="button" onClick={() => setLightbox(t.receipt_url)}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- external blob URL thumbnail */}
                        <img src={t.receipt_url} alt="View receipt" className="h-10 w-10 rounded-sm border border-sand-line object-cover" />
                      </button>
                    ) : (
                      <span className="text-xs text-ink-soft">No receipt</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {t.kind === 'revenue' ? (
                      t.matched_invoice_id ? (
                        <div className="flex flex-col gap-1">
                          <span className="w-fit rounded-full bg-teal/15 px-2.5 py-1 text-xs font-bold text-teal-deep">
                            #{t.matched_invoice_number} &middot; {t.matched_invoice_billed_to}
                          </span>
                          <button type="button" onClick={() => unmatch(t.id)} className="text-left text-xs font-semibold text-ink-soft hover:underline">
                            Unmatch
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setMatching(t)}
                          className="text-xs font-semibold text-teal-deep hover:underline"
                        >
                          Match to invoice
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-ink-soft">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1.5">
                      <button type="button" onClick={() => setEditing(t)} className="text-xs font-semibold text-teal-deep hover:underline">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(t)}
                        disabled={deletingKey === key}
                        className="text-xs font-semibold text-orange-deep hover:underline disabled:opacity-50"
                      >
                        {deletingKey === key ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-soft">
                  No transactions match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {lightbox && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close photo"
          onClick={() => setLightbox(null)}
          onKeyDown={(e) => e.key === 'Escape' && setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- external blob URL, full-size lightbox view */}
          <img src={lightbox} alt="Receipt" className="max-h-full max-w-full rounded-md object-contain shadow-soft" />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-6 top-6 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink"
          >
            Close
          </button>
        </div>
      )}

      {editing && (
        <EditTransactionModal
          transaction={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      {matching && (
        <MatchInvoiceModal
          entry={matching}
          onClose={() => setMatching(null)}
          onMatched={() => {
            setMatching(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
