import Link from 'next/link';
import type { InvoiceSummaryRow } from '@/lib/lms-data';
import MarkInvoicePaidButton from '@/components/admin/MarkInvoicePaidButton';

const STATUS_STYLES: Record<string, string> = {
  outstanding: 'bg-orange/20 text-orange-deep',
  paid: 'bg-teal/15 text-teal-deep',
  cancelled: 'bg-black/10 text-ink-soft',
};

function statusLabel(invoice: InvoiceSummaryRow): string {
  if (invoice.status === 'outstanding' && invoice.days_overdue > 0) {
    return `${invoice.days_overdue} day${invoice.days_overdue === 1 ? '' : 's'} overdue`;
  }
  if (invoice.status === 'outstanding') return 'Outstanding';
  if (invoice.status === 'paid') return 'Paid';
  return 'Cancelled';
}

export default function InvoicesSection({ childId, invoices, canEdit }: { childId: number; invoices: InvoiceSummaryRow[]; canEdit: boolean }) {
  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">Invoices</h3>
        {canEdit && (
          <div className="flex gap-3 text-sm">
            <Link href={`/admin/families/${childId}/invoices/new?type=tuition`} className="font-semibold text-teal-deep hover:underline">
              + Tuition invoice
            </Link>
            <Link href={`/admin/families/${childId}/invoices/new?type=activity`} className="font-semibold text-teal-deep hover:underline">
              + Activity invoice
            </Link>
          </div>
        )}
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {invoices.map((inv) => (
          <li key={inv.id} className="flex items-center justify-between gap-2 rounded-sm border border-sand-line px-3 py-2 text-sm">
            <div>
              <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
                Invoice #{String(inv.invoice_number).padStart(3, '0')}
              </a>
              <span className="ml-2 text-xs text-ink-soft capitalize">{inv.invoice_type}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[inv.status]}`}>
                {statusLabel(inv)}
              </span>
              {canEdit && inv.status === 'outstanding' && <MarkInvoicePaidButton invoiceId={inv.id} />}
            </div>
          </li>
        ))}
        {invoices.length === 0 && <li className="text-sm text-ink-soft">No invoices yet.</li>}
      </ul>
    </div>
  );
}
