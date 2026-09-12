import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { getAllLoans } from '@/lib/library';
import { formatDate } from '@/lib/admin-format';
import { formatIDR } from '@/lib/site-content';
import LibrarySubNav from '@/components/admin/LibrarySubNav';
import LibraryLoanActions from '@/components/admin/LibraryLoanActions';

export const dynamic = 'force-dynamic';

const ITEM_TYPE_LABELS: Record<string, string> = {
  book: 'Book',
  toy: 'Toy',
  sports_equipment: 'Sports equipment',
  other: 'Other',
};

export default async function AdminLibraryLoansPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const { status } = await searchParams;
  const loans = await getAllLoans();

  const filtered = loans.filter((l) => {
    if (status === 'out') return !l.returned_at;
    if (status === 'overdue') return !l.returned_at && l.days_overdue > 0;
    if (status === 'returned') return !!l.returned_at;
    return true;
  });

  const outCount = loans.filter((l) => !l.returned_at).length;
  const overdueCount = loans.filter((l) => !l.returned_at && l.days_overdue > 0).length;

  const tabs = [
    { key: undefined, label: 'All' },
    { key: 'out', label: 'On loan' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'returned', label: 'Returned' },
  ] as const;

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Library Loans</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {loans.length} total · {outCount} on loan · {overdueCount} overdue.
      </p>
      <LibrarySubNav active="/admin/library/loans" isAdmin={staff.role === 'admin'} />

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <a
            key={tab.label}
            href={tab.key ? `/admin/library/loans?status=${tab.key}` : '/admin/library/loans'}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              (status ?? undefined) === tab.key ? 'bg-teal text-white' : 'border border-sand-line bg-paper text-ink hover:border-teal'
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">Item</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Borrower</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Borrowed</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Due</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Returned</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Late fee</th>
              <th className="px-4 py-3 font-bold text-ink-soft"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((loan) => {
              const overdue = !loan.returned_at && loan.days_overdue > 0;
              return (
                <tr key={loan.id} className="border-b border-sand-line/60 last:border-0 align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{loan.item_title}</div>
                    <div className="text-xs text-ink-soft">{ITEM_TYPE_LABELS[loan.item_type]}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{loan.child_full_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(loan.borrowed_at)}</td>
                  <td className={`whitespace-nowrap px-4 py-3 font-semibold ${overdue ? 'text-orange-deep' : 'text-ink'}`}>
                    {formatDate(loan.due_date)}
                    {overdue && <span className="ml-1.5 rounded-full bg-orange/20 px-2 py-0.5 text-xs font-bold">{loan.days_overdue}d</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{loan.returned_at ? formatDate(loan.returned_at) : '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                    {loan.late_fee_waived
                      ? 'Waived'
                      : loan.estimated_late_fee_idr > 0
                        ? `${formatIDR(loan.estimated_late_fee_idr)}${loan.late_fee_invoice_id ? ' (invoiced)' : ''}`
                        : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <LibraryLoanActions
                      loanId={loan.id}
                      returned={!!loan.returned_at}
                      hasFee={loan.estimated_late_fee_idr > 0}
                      feeWaived={loan.late_fee_waived}
                      feeInvoiced={!!loan.late_fee_invoice_id}
                      dueSoonEmailSent={loan.due_soon_email_sent}
                    />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">No loans match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
