import Link from 'next/link';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { formatDate } from '@/lib/admin-format';
import { formatIDR } from '@/lib/site-content';
import { getAllCreditNotesForAdmin } from '@/lib/credit-notes';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-orange/20 text-orange-deep',
  applied: 'bg-teal/15 text-teal-deep',
  refunded: 'bg-teal/15 text-teal-deep',
  cancelled: 'bg-black/10 text-ink-soft',
};

const KIND_LABELS: Record<string, string> = {
  refund: 'Refund',
  credit_hold: 'Credit hold',
};

export default async function AdminCreditNotesPage() {
  await requireAdmin();
  await ensureSchema();

  const creditNotes = await getAllCreditNotesForAdmin();
  const openRefundsTotal = creditNotes.filter((cn) => cn.kind === 'refund' && cn.status === 'open').reduce((s, cn) => s + cn.remaining_idr, 0);
  const availableCreditTotal = creditNotes.filter((cn) => cn.kind === 'credit_hold' && cn.status === 'open').reduce((s, cn) => s + cn.remaining_idr, 0);

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Credit Notes</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {formatIDR(openRefundsTotal)} owed as refunds not yet paid out · {formatIDR(availableCreditTotal)} held as credit, available to apply.
      </p>

      <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">Credit note</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Child</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Kind</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Reason</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Amount</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Remaining</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Issued</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Status</th>
              <th className="px-4 py-3 font-bold text-ink-soft"></th>
            </tr>
          </thead>
          <tbody>
            {creditNotes.map((cn) => (
              <tr key={cn.id} className="border-b border-sand-line/60 last:border-0 align-top">
                <td className="whitespace-nowrap px-4 py-3">
                  <a href={`/api/credit-notes/${cn.id}/pdf`} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
                    #{String(cn.credit_note_number).padStart(3, '0')}
                  </a>
                </td>
                <td className="px-4 py-3 text-ink">
                  <Link href={`/admin/families/${cn.child_id}`} className="hover:underline">
                    {cn.child_full_name}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{KIND_LABELS[cn.kind]}</td>
                <td className="max-w-xs px-4 py-3 text-ink-soft">{cn.reason}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">{formatIDR(cn.amount_idr)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatIDR(cn.remaining_idr)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(cn.issued_at.slice(0, 10))}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${STATUS_STYLES[cn.status]}`}>{cn.status}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Link href={`/admin/families/${cn.child_id}`} className="text-xs font-semibold text-teal-deep hover:underline">
                    View &rarr;
                  </Link>
                </td>
              </tr>
            ))}
            {creditNotes.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-ink-soft">No credit notes have been issued yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
