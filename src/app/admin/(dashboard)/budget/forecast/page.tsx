import Link from 'next/link';
import { ensureSchema } from '@/lib/db';
import { getForecastSummary, getBudgetCategories, getForecastExpenseSuggestions, formatBudgetIDR } from '@/lib/budget';
import { quarterBoundsForDate, nextQuarterBoundsForDate } from '@/lib/budget-shared';
import BudgetTabs from '@/components/admin/BudgetTabs';
import ForecastEntryForm from '@/components/admin/ForecastEntryForm';
import DeleteForecastEntryButton from '@/components/admin/DeleteForecastEntryButton';
import AddSuggestedForecastButton from '@/components/admin/AddSuggestedForecastButton';

export const dynamic = 'force-dynamic';

export default async function BudgetForecastPage({ searchParams }: { searchParams: Promise<{ quarter?: string }> }) {
  await ensureSchema();
  const { quarter } = await searchParams;

  const bounds =
    quarter && /^\d{4}-\d{2}-\d{2}$/.test(quarter)
      ? quarterBoundsForDate(new Date(`${quarter}T00:00:00Z`))
      : nextQuarterBoundsForDate(new Date());

  const startAsDate = new Date(`${bounds.startDate}T00:00:00Z`);
  const prevBounds = quarterBoundsForDate(new Date(Date.UTC(startAsDate.getUTCFullYear(), startAsDate.getUTCMonth() - 3, 1)));
  const nextBounds = quarterBoundsForDate(new Date(Date.UTC(startAsDate.getUTCFullYear(), startAsDate.getUTCMonth() + 3, 1)));

  const [categories, summary, suggestions] = await Promise.all([
    getBudgetCategories(false),
    getForecastSummary(bounds.startDate, bounds.endDate),
    getForecastExpenseSuggestions(bounds.startDate),
  ]);

  const forecastedCategoryIds = new Set(summary.expenses.map((e) => e.category_id));
  const freshSuggestions = suggestions.filter((s) => !forecastedCategoryIds.has(s.categoryId));

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Budget Tracker</h1>
      <div className="mt-4">
        <BudgetTabs active="forecast" />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-ink">{bounds.label} forecast</h2>
        <div className="flex gap-4 text-sm font-semibold">
          <Link href={`/admin/budget/forecast?quarter=${prevBounds.startDate}`} className="text-teal-deep hover:underline">
            ← {prevBounds.label}
          </Link>
          <Link href={`/admin/budget/forecast?quarter=${nextBounds.startDate}`} className="text-teal-deep hover:underline">
            {nextBounds.label} →
          </Link>
        </div>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Estimated revenue and expenses for the quarter — separate from the school&apos;s own term dates in Budget
        Setup. &quot;Actual so far&quot; compares against what&apos;s really been logged in this date range.
      </p>

      <div className="mt-4 grid gap-4 rounded-md border border-sand-line bg-cream/50 p-6 sm:grid-cols-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">Projected revenue</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular-nums text-teal-deep">{formatBudgetIDR(summary.totalRevenueIdr)}</div>
          <div className="mt-1 text-xs text-ink-soft">Actual so far: {formatBudgetIDR(summary.actualRevenueIdr)}</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">Projected expenses</div>
          <div className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">{formatBudgetIDR(summary.totalExpensesIdr)}</div>
          <div className="mt-1 text-xs text-ink-soft">Actual so far: {formatBudgetIDR(summary.actualExpensesIdr)}</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">Projected net</div>
          <div className={`mt-1 font-display text-2xl font-semibold tabular-nums ${summary.netIdr < 0 ? 'text-red-700' : 'text-teal-deep'}`}>
            {formatBudgetIDR(summary.netIdr)}
          </div>
          <div className="mt-1 text-xs text-ink-soft">Actual net so far: {formatBudgetIDR(summary.actualRevenueIdr - summary.actualExpensesIdr)}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <ForecastEntryForm
          quarterLabel={bounds.label}
          quarterStartDate={bounds.startDate}
          quarterEndDate={bounds.endDate}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />

        <div className="flex flex-col gap-6">
          {freshSuggestions.length > 0 && (
            <div className="rounded-md border border-dashed border-sand-line bg-paper p-4">
              <h3 className="font-display text-sm font-semibold text-ink">Suggested from the trailing 3 months</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {freshSuggestions.map((s) => (
                  <li key={s.categoryId} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      {s.categoryName} — {formatBudgetIDR(s.suggestedAmountIdr)}
                    </span>
                    <AddSuggestedForecastButton
                      quarterLabel={bounds.label}
                      quarterStartDate={bounds.startDate}
                      quarterEndDate={bounds.endDate}
                      categoryId={s.categoryId}
                      categoryName={s.categoryName}
                      suggestedAmountIdr={s.suggestedAmountIdr}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="font-display text-base font-semibold text-teal-deep">Revenue estimates</h3>
            <div className="mt-2 flex flex-col gap-2">
              {summary.revenue.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-md border border-sand-line bg-paper p-3 shadow-soft">
                  <div>
                    <div className="font-semibold text-ink">{r.label}</div>
                    {r.notes && <div className="text-xs text-ink-soft">{r.notes}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-base font-semibold tabular-nums text-teal-deep">{formatBudgetIDR(r.estimated_amount_idr)}</span>
                    <DeleteForecastEntryButton id={r.id} />
                  </div>
                </div>
              ))}
              {summary.revenue.length === 0 && <p className="text-sm text-ink-soft">No revenue estimates yet.</p>}
            </div>
          </div>

          <div>
            <h3 className="font-display text-base font-semibold text-orange-deep">Expense estimates</h3>
            <div className="mt-2 flex flex-col gap-2">
              {summary.expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 rounded-md border border-sand-line bg-paper p-3 shadow-soft">
                  <div>
                    <div className="font-semibold text-ink">{e.label}</div>
                    <div className="text-xs text-ink-soft">
                      {e.category_name}
                      {e.notes ? ` · ${e.notes}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-base font-semibold tabular-nums text-ink">{formatBudgetIDR(e.estimated_amount_idr)}</span>
                    <DeleteForecastEntryButton id={e.id} />
                  </div>
                </div>
              ))}
              {summary.expenses.length === 0 && <p className="text-sm text-ink-soft">No expense estimates yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
