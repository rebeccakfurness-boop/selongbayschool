import Link from 'next/link';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getAllLunchOrders } from '@/lib/lunch-orders';
import { weekdaysSummaryLabel } from '@/lib/lunch-calc';
import { formatDate } from '@/lib/admin-format';
import { formatIDR } from '@/lib/site-content';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  outstanding: 'bg-orange/20 text-orange-deep',
  paid: 'bg-teal/15 text-teal-deep',
  cancelled: 'bg-black/10 text-ink-soft',
};

export default async function LunchOrdersPage() {
  await requireAdmin();
  await ensureSchema();
  const orders = await getAllLunchOrders();

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Lunch Orders</h1>
      <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
        Every lunch order and &quot;bring own lunch&quot; preference placed by parents. Pricing and the supplier&apos;s
        bank details are set at{' '}
        <Link href="/admin/settings" className="font-semibold text-teal-deep underline">
          Settings
        </Link>
        .
      </p>

      <div className="mt-6 overflow-x-auto rounded-md border border-sand-line bg-paper shadow-soft">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-sand-line bg-sand/20 text-xs font-bold uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="px-4 py-3">Child</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Preferences / Allergies</th>
              <th className="px-4 py-3">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-sand-line last:border-0">
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">
                  <Link href={`/admin/families/${o.child_id}`} className="hover:underline">
                    {o.child_full_name}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{o.own_lunch ? 'Bringing own' : 'Ordered'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                  {o.start_date && o.end_date ? `${formatDate(o.start_date)} – ${formatDate(o.end_date)}` : '-'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                  {o.own_lunch ? '-' : weekdaysSummaryLabel({ monday: o.monday, tuesday: o.tuesday, wednesday: o.wednesday, thursday: o.thursday, friday: o.friday })}
                </td>
                <td className="whitespace-nowrap px-4 py-3 capitalize text-ink-soft">{o.lunch_size ?? '-'}</td>
                <td className="max-w-[240px] px-4 py-3 text-xs text-ink-soft">
                  {o.food_preference && <div>Food: {o.food_preference}</div>}
                  {o.allergies_notes && <div className="font-semibold text-orange-deep">Allergies: {o.allergies_notes}</div>}
                  {!o.food_preference && !o.allergies_notes && '-'}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {o.invoice_id ? (
                    <div className="flex items-center gap-2">
                      <a href={`/api/invoices/${o.invoice_id}/pdf`} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-deep underline">
                        #{String(o.invoice_number).padStart(3, '0')}
                      </a>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[o.invoice_status ?? 'outstanding']}`}>
                        {o.invoice_status}
                      </span>
                      {o.invoice_total !== null && <span className="text-xs text-ink-soft">{formatIDR(o.invoice_total)}</span>}
                    </div>
                  ) : (
                    <span className="text-ink-soft">-</span>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-soft">
                  No lunch orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
