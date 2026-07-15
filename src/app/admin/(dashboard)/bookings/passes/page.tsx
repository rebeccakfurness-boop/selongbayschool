import { ensureSchema, sql } from '@/lib/db';
import { formatDateTime } from '@/lib/admin-format';
import { formatIDR } from '@/lib/site-content';
import MarkPaidButton from '@/components/admin/MarkPaidButton';
import BookingsTabs from '@/components/admin/BookingsTabs';

export const dynamic = 'force-dynamic';

interface PassRow {
  id: number;
  child_name: string;
  total_sessions: number;
  sessions_used: number;
  price_paid_idr: number | null;
  purchased_at: string;
  expires_at: string;
  payment_method: string | null;
  status: string;
  customer_name: string | null;
  customer_email: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  pay_at_session: 'Pay at session',
  paid: 'Paid',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

const STATUS_STYLES: Record<string, string> = {
  pending_payment: 'bg-orange/20 text-orange-deep',
  pay_at_session: 'bg-sand text-ink-soft',
  paid: 'bg-teal/15 text-teal-deep',
  expired: 'bg-black/10 text-ink-soft',
  cancelled: 'bg-black/10 text-ink-soft',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pay_online: 'Pay online',
  pay_at_session: 'Pay at session',
};

function PassStatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[status] ?? 'bg-sand text-ink-soft'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default async function AdminPassesPage() {
  await ensureSchema();
  const passes = (await sql`
    SELECT p.id, p.child_name, p.total_sessions, p.sessions_used, p.price_paid_idr,
           p.purchased_at, p.expires_at, p.payment_method, p.status,
           c.name AS customer_name, c.email AS customer_email
    FROM passes p
    JOIN customers c ON c.id = p.customer_id
    ORDER BY p.purchased_at DESC
  `) as unknown as PassRow[];

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">Passes</h1>
        <BookingsTabs active="passes" />
      </div>
      <p className="mt-1 text-sm text-ink-soft">{passes.length} total.</p>

      <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">Purchased</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Customer</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Child</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Sessions remaining</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Expires</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Amount</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Payment method</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Status</th>
            </tr>
          </thead>
          <tbody>
            {passes.map((pass) => (
              <tr key={pass.id} className="border-b border-sand-line/60 last:border-0 align-top">
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDateTime(pass.purchased_at)}</td>
                <td className="px-4 py-3 text-ink-soft">
                  <div className="font-semibold text-ink">{pass.customer_name || '—'}</div>
                  <div>{pass.customer_email}</div>
                </td>
                <td className="px-4 py-3 text-ink">{pass.child_name}</td>
                <td className="px-4 py-3 tabular-nums text-ink-soft">
                  {pass.total_sessions - pass.sessions_used} / {pass.total_sessions}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDateTime(pass.expires_at)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">
                  {pass.price_paid_idr ? formatIDR(pass.price_paid_idr) : '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                  {pass.payment_method ? PAYMENT_METHOD_LABELS[pass.payment_method] ?? pass.payment_method : '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <PassStatusPill status={pass.status} />
                  {pass.status === 'pending_payment' && (
                    <div className="mt-1">
                      <MarkPaidButton id={pass.id} kind="passes" />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {passes.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-ink-soft">No passes purchased yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
