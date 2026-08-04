import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { formatDate } from '@/lib/admin-format';
import { formatIDR } from '@/lib/site-content';
import MarkInvoicePaidButton from '@/components/admin/MarkInvoicePaidButton';
import SendInvoiceButton from '@/components/admin/SendInvoiceButton';
import VoidInvoiceButton from '@/components/admin/VoidInvoiceButton';
import DeleteInvoiceButton from '@/components/admin/DeleteInvoiceButton';

export const dynamic = 'force-dynamic';

interface InvoiceRow {
  id: number;
  invoice_number: number;
  invoice_type: 'tuition' | 'activity' | 'lunch';
  billed_to_name: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  status: 'outstanding' | 'paid' | 'cancelled';
  days_overdue: number;
  children_names: string | null;
  default_email: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  outstanding: 'bg-orange/20 text-orange-deep',
  paid: 'bg-teal/15 text-teal-deep',
  cancelled: 'bg-black/10 text-ink-soft',
};

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  await ensureSchema();
  const { status } = await searchParams;
  const statusFilter = status && ['outstanding', 'paid', 'cancelled', 'overdue'].includes(status) ? status : null;

  const invoices = (await sql`
    SELECT
      i.id, i.invoice_number, i.invoice_type, i.billed_to_name, i.issue_date::text, i.due_date::text,
      i.total_amount, i.status,
      GREATEST(0, (CURRENT_DATE - i.due_date))::int AS days_overdue,
      string_agg(COALESCE(c.child_nickname, c.child_full_name), ', ' ORDER BY ic.sort_order) AS children_names,
      (array_agg(c.primary_contact_email ORDER BY ic.sort_order))[1] AS default_email
    FROM invoices i
    LEFT JOIN invoice_children ic ON ic.invoice_id = i.id
    LEFT JOIN children c ON c.id = ic.child_id
    GROUP BY i.id
    ORDER BY i.issue_date DESC, i.invoice_number DESC
  `) as unknown as InvoiceRow[];

  const filtered = invoices.filter((inv) => {
    if (!statusFilter) return true;
    if (statusFilter === 'overdue') return inv.status === 'outstanding' && inv.days_overdue > 0;
    return inv.status === statusFilter;
  });

  const outstandingTotal = invoices.filter((i) => i.status === 'outstanding').reduce((s, i) => s + i.total_amount, 0);
  const overdueCount = invoices.filter((i) => i.status === 'outstanding' && i.days_overdue > 0).length;

  const tabs = [
    { key: null, label: 'All' },
    { key: 'outstanding', label: 'Outstanding' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'paid', label: 'Paid' },
    { key: 'cancelled', label: 'Cancelled' },
  ] as const;

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Invoices</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {invoices.length} total · {formatIDR(outstandingTotal)} outstanding · {overdueCount} overdue.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <a
            key={tab.label}
            href={tab.key ? `/admin/invoices?status=${tab.key}` : '/admin/invoices'}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              statusFilter === tab.key ? 'bg-teal text-white' : 'border border-sand-line bg-paper text-ink hover:border-teal'
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">Invoice</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Type</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Children</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Billed to</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Issued</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Due</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Total</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Status</th>
              <th className="px-4 py-3 font-bold text-ink-soft"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => {
              const overdue = inv.status === 'outstanding' && inv.days_overdue > 0;
              return (
                <tr key={inv.id} className="border-b border-sand-line/60 last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3">
                    <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
                      #{String(inv.invoice_number).padStart(3, '0')}
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 capitalize text-ink-soft">{inv.invoice_type}</td>
                  <td className="px-4 py-3 text-ink">{inv.children_names || '—'}</td>
                  <td className="px-4 py-3 text-ink-soft">{inv.billed_to_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(inv.issue_date)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(inv.due_date)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">{formatIDR(inv.total_amount)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[inv.status]}`}>
                      {inv.status === 'paid' ? 'Paid' : overdue ? `${inv.days_overdue}d overdue` : inv.status === 'cancelled' ? 'Cancelled' : 'Outstanding'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <SendInvoiceButton invoiceId={inv.id} defaultEmail={inv.default_email ?? ''} />
                      <Link href={`/admin/invoices/${inv.id}/edit`} className="text-xs font-semibold text-teal-deep hover:underline">
                        Edit
                      </Link>
                      {inv.status === 'outstanding' && <MarkInvoicePaidButton invoiceId={inv.id} />}
                      {inv.status !== 'cancelled' && <VoidInvoiceButton invoiceId={inv.id} />}
                      <DeleteInvoiceButton invoiceId={inv.id} invoiceNumber={inv.invoice_number} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-ink-soft">No invoices match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
