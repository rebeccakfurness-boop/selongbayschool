import { ensureSchema } from '@/lib/db';
import { getExpenseEntries, getBudgetCategories, formatBudgetIDR } from '@/lib/budget';
import { formatDate } from '@/lib/admin-format';
import BudgetTabs from '@/components/admin/BudgetTabs';
import LogExpenseForm from '@/components/admin/LogExpenseForm';

export const dynamic = 'force-dynamic';

export default async function LogExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; category?: string }>;
}) {
  await ensureSchema();
  const { from, to, category } = await searchParams;
  const categories = await getBudgetCategories(false);
  const entries = await getExpenseEntries({ from: from || undefined, to: to || undefined, categoryId: category ? Number(category) : undefined });

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Budget Tracker</h1>
      <div className="mt-4">
        <BudgetTabs active="expenses" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <LogExpenseForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />

        <div className="flex flex-col gap-4">
          <form method="get" className="flex flex-wrap items-end gap-3 rounded-md border border-sand-line bg-paper p-4 shadow-soft">
            <div className="flex flex-col gap-1">
              <label htmlFor="exp-from" className="text-xs font-bold text-ink-soft">From</label>
              <input id="exp-from" type="date" name="from" defaultValue={from} className="rounded-sm border border-sand-line px-3 py-2 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="exp-to" className="text-xs font-bold text-ink-soft">To</label>
              <input id="exp-to" type="date" name="to" defaultValue={to} className="rounded-sm border border-sand-line px-3 py-2 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="exp-category" className="text-xs font-bold text-ink-soft">Category</label>
              <select id="exp-category" name="category" defaultValue={category ?? ''} className="rounded-sm border border-sand-line px-3 py-2 text-sm">
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal-deep">
              Filter
            </button>
            {(from || to || category) && (
              <a href="/admin/budget/expenses" className="text-sm font-semibold text-ink-soft hover:underline">
                Clear
              </a>
            )}
          </form>

          <div className="flex flex-col gap-2">
            {entries.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center gap-3 rounded-md border border-sand-line bg-paper p-3 shadow-soft">
                {e.receipt_url ? (
                  <a href={e.receipt_url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element -- external blob URL, avoid next/image config for a receipt thumbnail */}
                    <img src={e.receipt_url} alt="Receipt" className="h-14 w-14 rounded-sm border border-sand-line object-cover" />
                  </a>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-sm border border-dashed border-sand-line text-[9px] text-ink-soft">
                    No photo
                  </div>
                )}
                <div className="min-w-[9rem] flex-1">
                  <div className="font-semibold text-ink">{e.vendor_description}</div>
                  <div className="text-xs text-ink-soft">
                    {formatDate(e.entry_date)} · {e.category_name} · authorized by {e.authorized_by}
                    {e.created_by_label && ` · logged by ${e.created_by_label}`}
                  </div>
                </div>
                <div className="font-display text-lg font-semibold tabular-nums text-orange-deep">{formatBudgetIDR(e.amount_idr)}</div>
              </div>
            ))}
            {entries.length === 0 && (
              <div className="rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft">
                No expenses logged {from || to || category ? 'for this filter' : 'yet'}.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
