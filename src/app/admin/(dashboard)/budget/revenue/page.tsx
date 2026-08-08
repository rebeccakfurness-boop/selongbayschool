import { ensureSchema } from '@/lib/db';
import { getRevenueEntries, formatBudgetIDR } from '@/lib/budget';
import { formatDate } from '@/lib/admin-format';
import BudgetTabs from '@/components/admin/BudgetTabs';
import LogRevenueForm from '@/components/admin/LogRevenueForm';

export const dynamic = 'force-dynamic';

const METHOD_LABELS: Record<string, string> = { bank_transfer: 'Bank Transfer', cash: 'Cash' };

export default async function LogRevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; method?: string }>;
}) {
  await ensureSchema();
  const { from, to, method } = await searchParams;
  const entries = await getRevenueEntries({ from: from || undefined, to: to || undefined, paymentMethod: method || undefined });

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Budget Tracker</h1>
      <div className="mt-4">
        <BudgetTabs active="revenue" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <LogRevenueForm />

        <div className="flex flex-col gap-4">
          <form method="get" className="flex flex-wrap items-end gap-3 rounded-md border border-sand-line bg-paper p-4 shadow-soft">
            <div className="flex flex-col gap-1">
              <label htmlFor="rev-from" className="text-xs font-bold text-ink-soft">From</label>
              <input id="rev-from" type="date" name="from" defaultValue={from} className="rounded-sm border border-sand-line px-3 py-2 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="rev-to" className="text-xs font-bold text-ink-soft">To</label>
              <input id="rev-to" type="date" name="to" defaultValue={to} className="rounded-sm border border-sand-line px-3 py-2 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="rev-method" className="text-xs font-bold text-ink-soft">Method</label>
              <select id="rev-method" name="method" defaultValue={method ?? ''} className="rounded-sm border border-sand-line px-3 py-2 text-sm">
                <option value="">All</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <button type="submit" className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal-deep">
              Filter
            </button>
            {(from || to || method) && (
              <a href="/admin/budget/revenue" className="text-sm font-semibold text-ink-soft hover:underline">
                Clear
              </a>
            )}
          </form>

          <div className="flex flex-col gap-2">
            {entries.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-md border border-sand-line bg-paper p-3 shadow-soft">
                {r.receipt_url ? (
                  <a href={r.receipt_url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element -- external blob URL, avoid next/image config for a receipt thumbnail */}
                    <img src={r.receipt_url} alt="Receipt" className="h-14 w-14 rounded-sm border border-sand-line object-cover" />
                  </a>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-sm border border-dashed border-sand-line text-[9px] text-ink-soft">
                    No photo
                  </div>
                )}
                <div className="min-w-[9rem] flex-1">
                  <div className="font-semibold text-ink">{r.payer_source}</div>
                  <div className="text-xs text-ink-soft">
                    {formatDate(r.entry_date)} · {METHOD_LABELS[r.payment_method]}
                    {r.created_by_label && ` · logged by ${r.created_by_label}`}
                  </div>
                  {r.description && <div className="mt-1 text-sm text-ink-soft">{r.description}</div>}
                </div>
                <div className="font-display text-lg font-semibold tabular-nums text-teal-deep">{formatBudgetIDR(r.amount_idr)}</div>
              </div>
            ))}
            {entries.length === 0 && (
              <div className="rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft">
                No revenue logged {from || to || method ? 'for this filter' : 'yet'}.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
