import { ensureSchema } from '@/lib/db';
import { getBudgetSettings } from '@/lib/budget';
import BudgetTabs from '@/components/admin/BudgetTabs';
import BudgetReportsPanel from '@/components/admin/BudgetReportsPanel';

export const dynamic = 'force-dynamic';

export default async function BudgetReportsPage() {
  await ensureSchema();
  const settings = await getBudgetSettings();

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Budget Tracker</h1>
      <div className="mt-4">
        <BudgetTabs active="reports" />
      </div>

      <div className="mt-6">
        <BudgetReportsPanel termLabel={settings.term_label} />
      </div>
    </section>
  );
}
