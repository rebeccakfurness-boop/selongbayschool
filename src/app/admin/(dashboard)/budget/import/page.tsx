import { ensureSchema } from '@/lib/db';
import { getBudgetCategories, getBudgetImportBatches } from '@/lib/budget';
import { formatDate } from '@/lib/admin-format';
import BudgetTabs from '@/components/admin/BudgetTabs';
import StatementImportReview from '@/components/admin/StatementImportReview';

export const dynamic = 'force-dynamic';

export default async function BudgetImportPage() {
  await ensureSchema();
  const [categories, batches] = await Promise.all([getBudgetCategories(false), getBudgetImportBatches()]);

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Budget Tracker</h1>
      <div className="mt-4">
        <BudgetTabs active="import" />
      </div>

      <div className="mt-6">
        <StatementImportReview categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
      </div>

      {batches.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold text-ink">Previous imports</h2>
          <div className="mt-3 flex flex-col gap-2">
            {batches.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-sand-line bg-paper p-3 shadow-soft text-sm">
                <div>
                  <div className="font-semibold text-ink">{b.source_label}</div>
                  <div className="text-xs text-ink-soft">
                    {b.revenue_count} revenue, {b.expense_count} expense row(s) · imported {formatDate(b.imported_at)}
                    {b.imported_by_label && ` by ${b.imported_by_label}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
