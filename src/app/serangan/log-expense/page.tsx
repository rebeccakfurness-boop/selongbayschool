import { getCurrentSeranganAdmin } from '@/lib/current-serangan';
import SeranganNav from '@/components/serangan/SeranganNav';
import SeranganLogExpenseForm from '@/components/serangan/SeranganLogExpenseForm';

export const dynamic = 'force-dynamic';

export default async function SeranganLogExpensePage() {
  const admin = await getCurrentSeranganAdmin();

  return (
    <div className="min-h-screen bg-cream">
      <SeranganNav active="/serangan/log-expense" role={admin.role} />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Log an Expense</h1>
        <p className="mt-1 text-sm text-ink-soft">Record what was spent. This saves straight to the dashboard -- Shaun and Elizabeth review it from the Budget &amp; Donations page.</p>
        <div className="mt-6">
          <SeranganLogExpenseForm />
        </div>
      </div>
    </div>
  );
}
