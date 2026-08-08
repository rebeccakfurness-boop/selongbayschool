import { ensureSchema } from '@/lib/db';
import { getCombinedTransactions } from '@/lib/budget';
import BudgetTabs from '@/components/admin/BudgetTabs';
import TransactionLogClient from '@/components/admin/TransactionLogClient';

export const dynamic = 'force-dynamic';

export default async function TransactionLogPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await ensureSchema();
  const { from, to } = await searchParams;
  const transactions = await getCombinedTransactions({ from: from || undefined, to: to || undefined });

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Budget Tracker</h1>
      <div className="mt-4">
        <BudgetTabs active="transactions" />
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3 rounded-md border border-sand-line bg-paper p-4 shadow-soft">
        <div className="flex flex-col gap-1">
          <label htmlFor="tx-from" className="text-xs font-bold text-ink-soft">From</label>
          <input id="tx-from" type="date" name="from" defaultValue={from} className="rounded-sm border border-sand-line px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="tx-to" className="text-xs font-bold text-ink-soft">To</label>
          <input id="tx-to" type="date" name="to" defaultValue={to} className="rounded-sm border border-sand-line px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal-deep">
          Filter by date
        </button>
        {(from || to) && (
          <a href="/admin/budget/transactions" className="text-sm font-semibold text-ink-soft hover:underline">
            Clear
          </a>
        )}
      </form>

      <div className="mt-4">
        <TransactionLogClient transactions={transactions} />
      </div>
    </section>
  );
}
