import { ensureSchema } from '@/lib/db';
import { getDashboardData, formatBudgetIDR, type CategorySummary } from '@/lib/budget';
import BudgetTabs from '@/components/admin/BudgetTabs';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<CategorySummary['status'], { bar: string; pill: string; label: string }> = {
  healthy: { bar: 'bg-teal', pill: 'bg-teal/15 text-teal-deep', label: 'On track' },
  warning: { bar: 'bg-orange-deep', pill: 'bg-orange/20 text-orange-deep', label: 'Watch closely' },
  over: { bar: 'bg-red-600', pill: 'bg-red-600/15 text-red-700', label: 'Over budget' },
};

function CategoryCard({ category }: { category: CategorySummary }) {
  const style = STATUS_STYLES[category.status];
  const pct = category.monthly_budget_idr > 0 ? Math.min(150, Math.round((category.spent_month_idr / category.monthly_budget_idr) * 100)) : category.spent_month_idr > 0 ? 150 : 0;

  return (
    <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-base font-semibold text-ink">{category.name}</h3>
        <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${style.pill}`}>{style.label}</span>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-sand/60">
        <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">Budgeted</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-ink">{formatBudgetIDR(category.monthly_budget_idr)}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">Spent</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-ink">{formatBudgetIDR(category.spent_month_idr)}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">Remaining</dt>
          <dd className={`mt-0.5 font-semibold tabular-nums ${category.remaining_month_idr < 0 ? 'text-red-700' : 'text-ink'}`}>
            {formatBudgetIDR(category.remaining_month_idr)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</div>
      <div className={`mt-1 font-display text-2xl font-semibold tabular-nums ${tone === 'negative' ? 'text-red-700' : tone === 'positive' ? 'text-teal-deep' : 'text-ink'}`}>
        {value}
      </div>
    </div>
  );
}

export default async function BudgetDashboardPage() {
  await ensureSchema();
  const data = await getDashboardData();

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Budget Tracker</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            Visible to the Principal and the admin team who unlock it: how much is left to spend in each category,
            right now.
          </p>
        </div>
      </div>
      <div className="mt-4">
        <BudgetTabs active="dashboard" />
      </div>

      <div className="mt-6 grid gap-4 rounded-md border border-sand-line bg-cream/50 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStat label={`Cash on hand`} value={formatBudgetIDR(data.cashOnHandIdr)} />
        <SummaryStat label={`Revenue: ${data.month.label}`} value={formatBudgetIDR(data.month.revenue_idr)} tone="positive" />
        <SummaryStat label={`Expenses: ${data.month.label}`} value={formatBudgetIDR(data.month.expenses_idr)} />
        <SummaryStat
          label={`Net: ${data.month.label}`}
          value={formatBudgetIDR(data.month.net_idr)}
          tone={data.month.net_idr < 0 ? 'negative' : 'positive'}
        />
      </div>

      <div className="mt-4 grid gap-4 rounded-md border border-sand-line bg-paper p-6 shadow-soft sm:grid-cols-3">
        <SummaryStat label={`Revenue: ${data.term.label}`} value={formatBudgetIDR(data.term.revenue_idr)} tone="positive" />
        <SummaryStat label={`Expenses: ${data.term.label}`} value={formatBudgetIDR(data.term.expenses_idr)} />
        <SummaryStat
          label={`Net: ${data.term.label}`}
          value={formatBudgetIDR(data.term.net_idr)}
          tone={data.term.net_idr < 0 ? 'negative' : 'positive'}
        />
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Categories this month</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.categories.map((c) => (
          <CategoryCard key={c.id} category={c} />
        ))}
        {data.categories.length === 0 && (
          <div className="rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft sm:col-span-3">
            No budget categories yet. Add one from Budget Setup.
          </div>
        )}
      </div>
    </section>
  );
}
