import { ensureSchema } from '@/lib/db';
import { requireSeranganAdmin } from '@/lib/current-serangan';
import { getAllBudgets, getRecentDonations, getRecentExpenditures } from '@/lib/serangan';
import SeranganNav from '@/components/serangan/SeranganNav';
import SeranganFinancesManager from '@/components/serangan/SeranganFinancesManager';

export const dynamic = 'force-dynamic';

export default async function SeranganFinancesPage() {
  const admin = await requireSeranganAdmin();
  await ensureSchema();
  const [budgets, donations, expenditures] = await Promise.all([
    getAllBudgets(),
    getRecentDonations(200),
    getRecentExpenditures(200),
  ]);

  return (
    <div className="min-h-screen bg-cream">
      <SeranganNav active="/serangan/finances" role={admin.role} />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Budget &amp; Donations</h1>
        <p className="mt-1 text-sm text-ink-soft">Set the annual budget, and record every donation and expense.</p>
        <div className="mt-6">
          <SeranganFinancesManager initialBudgets={budgets} initialDonations={donations} initialExpenditures={expenditures} />
        </div>
      </div>
    </div>
  );
}
