import { ensureSchema } from '@/lib/db';
import { getBudgetCategories, getBudgetSettings, getCategoryHistory } from '@/lib/budget';
import BudgetTabs from '@/components/admin/BudgetTabs';
import BudgetSetupManager, { type CategoryWithHistory } from '@/components/admin/BudgetSetupManager';
import BudgetSettingsForm from '@/components/admin/BudgetSettingsForm';

export const dynamic = 'force-dynamic';

export default async function BudgetSetupPage() {
  await ensureSchema();
  const [categories, settings] = await Promise.all([getBudgetCategories(true), getBudgetSettings()]);

  const categoriesWithHistory: CategoryWithHistory[] = await Promise.all(
    categories.map(async (c) => ({
      id: c.id,
      name: c.name,
      monthly_budget_idr: c.monthly_budget_idr,
      is_archived: c.is_archived,
      history: await getCategoryHistory(c.id),
    }))
  );

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Budget Tracker</h1>
      <div className="mt-4">
        <BudgetTabs active="setup" />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <BudgetSettingsForm settings={settings} />
        <BudgetSetupManager categories={categoriesWithHistory} />
      </div>
    </section>
  );
}
