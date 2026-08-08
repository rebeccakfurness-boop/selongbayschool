'use client';

import { useMemo, useState } from 'react';
import { formatBudgetIDR } from '@/lib/budget-shared';
import { formatDate } from '@/lib/admin-format';
import type { CombinedTransaction } from '@/lib/budget';

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

export default function TransactionLogClient({ transactions }: { transactions: CombinedTransaction[] }) {
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | 'revenue' | 'expense'>('all');
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (kindFilter !== 'all' && t.kind !== kindFilter) return false;
      if (query.trim() && !matches(t, query.trim())) return false;
      return true;
    });
  }, [transactions, query, kindFilter]);

  const totalRevenue = filtered.filter((t) => t.kind === 'revenue').reduce((sum, t) => sum + t.amount_idr, 0);
  const totalExpenses = filtered.filter((t) => t.kind === 'expense').reduce((sum, t) => sum + t.amount_idr, 0);

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

      <div className="overflow-x-auto rounded-md border border-sand-line bg-paper shadow-soft">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">Date</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Type</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Who / category</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Details</th>
              <th className="px-4 py-3 text-right font-bold text-ink-soft">Amount</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Photo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={`${t.kind}-${t.id}`} className="border-b border-sand-line/60 last:border-0 align-top">
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
                  {t.kind === 'revenue' ? t.description || '—' : `${t.vendor_description} · authorized by ${t.authorized_by}`}
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
                    <span className="text-xs text-ink-soft">—</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-soft">
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
    </div>
  );
}
