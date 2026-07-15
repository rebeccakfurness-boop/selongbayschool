import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ensureSchema, sql } from '@/lib/db';
import { formatDateTime } from '@/lib/admin-format';
import { formatIDR } from '@/lib/site-content';
import MarkPaidButton from '@/components/admin/MarkPaidButton';

export const dynamic = 'force-dynamic';

interface CustomerDetail {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  last_login_at: string | null;
}

interface BookingRow {
  id: number;
  activity_name: string;
  slot_date: string;
  slot_time: string;
  child_name: string;
  child_age: string;
  emergency_contact: string;
  status: string;
  payment_method: string | null;
  created_at: string;
}

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
}

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  pay_at_session: 'Pay at session',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

const PASS_STATUS_LABELS: Record<string, string> = {
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
  pack_session: 'Activity pack',
};

function StatusPill({ label, status }: { label: string; status: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[status] ?? 'bg-sand text-ink-soft'}`}>
      {label}
    </span>
  );
}

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const customerId = Number(id);
  if (!Number.isInteger(customerId)) {
    notFound();
  }

  const [customer] = (await sql`
    SELECT id, name, email, phone, created_at, last_login_at FROM customers WHERE id = ${customerId}
  `) as unknown as CustomerDetail[];

  if (!customer) {
    notFound();
  }

  const bookings = (await sql`
    SELECT b.id, b.activity_name, s.session_date::text AS slot_date, s.session_time AS slot_time,
           b.child_name, b.child_age, b.emergency_contact, b.status, b.payment_method, b.created_at
    FROM bookings b
    JOIN sessions s ON s.id = b.slot_id
    WHERE b.customer_id = ${customerId}
    ORDER BY b.created_at DESC
  `) as unknown as BookingRow[];

  const passes = (await sql`
    SELECT id, child_name, total_sessions, sessions_used, price_paid_idr, purchased_at, expires_at, payment_method, status
    FROM passes WHERE customer_id = ${customerId}
    ORDER BY purchased_at DESC
  `) as unknown as PassRow[];

  const children = new Map<string, string>();
  for (const b of bookings) children.set(b.child_name, b.child_age);
  for (const p of passes) if (!children.has(p.child_name)) children.set(p.child_name, '');

  return (
    <section className="flex flex-col gap-8">
      <div>
        <Link href="/admin/customers" className="text-sm font-semibold text-teal-deep hover:underline">
          &larr; All parent accounts
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{customer.name || 'Unnamed parent'}</h1>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-sand-line bg-paper p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">Email</div>
          <div className="mt-1 font-semibold text-ink">{customer.email}</div>
        </div>
        <div className="rounded-md border border-sand-line bg-paper p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">Phone</div>
          <div className="mt-1 font-semibold text-ink">{customer.phone || '-'}</div>
        </div>
        <div className="rounded-md border border-sand-line bg-paper p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">Joined</div>
          <div className="mt-1 font-semibold text-ink">{formatDateTime(customer.created_at)}</div>
        </div>
        <div className="rounded-md border border-sand-line bg-paper p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">Last login</div>
          <div className="mt-1 font-semibold text-ink">
            {customer.last_login_at ? formatDateTime(customer.last_login_at) : 'Never'}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Children</h2>
        {children.size === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No child details on file yet.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.from(children.entries()).map(([name, age]) => (
              <span key={name} className="rounded-full border border-sand-line bg-paper px-4 py-1.5 text-sm font-semibold text-ink">
                {name}
                {age && <span className="font-normal text-ink-soft"> &middot; {age}</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Bookings</h2>
        <div className="mt-2 overflow-x-auto rounded-md border border-sand-line bg-paper">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-sand-line bg-sand/40 text-left">
                <th className="px-4 py-3 font-bold text-ink-soft">Booked</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Activity</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Date &amp; time</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Child</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Emergency contact</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Payment method</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((row) => (
                <tr key={row.id} className="border-b border-sand-line/60 last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDateTime(row.created_at)}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{row.activity_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{row.slot_date} &middot; {row.slot_time}</td>
                  <td className="px-4 py-3 text-ink-soft">{row.child_name} ({row.child_age})</td>
                  <td className="px-4 py-3 text-ink-soft">{row.emergency_contact}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                    {row.payment_method ? PAYMENT_METHOD_LABELS[row.payment_method] ?? row.payment_method : '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusPill label={BOOKING_STATUS_LABELS[row.status] ?? row.status} status={row.status} />
                    {row.status === 'pending_payment' && (
                      <div className="mt-1">
                        <MarkPaidButton id={row.id} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">No bookings yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Passes</h2>
        <div className="mt-2 overflow-x-auto rounded-md border border-sand-line bg-paper">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-sand-line bg-sand/40 text-left">
                <th className="px-4 py-3 font-bold text-ink-soft">Purchased</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Child</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Sessions remaining</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Expires</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Amount</th>
                <th className="px-4 py-3 font-bold text-ink-soft">Status</th>
              </tr>
            </thead>
            <tbody>
              {passes.map((pass) => (
                <tr key={pass.id} className="border-b border-sand-line/60 last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDateTime(pass.purchased_at)}</td>
                  <td className="px-4 py-3 text-ink">{pass.child_name}</td>
                  <td className="px-4 py-3 tabular-nums text-ink-soft">
                    {pass.total_sessions - pass.sessions_used} / {pass.total_sessions}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDateTime(pass.expires_at)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">
                    {pass.price_paid_idr ? formatIDR(pass.price_paid_idr) : '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusPill label={PASS_STATUS_LABELS[pass.status] ?? pass.status} status={pass.status} />
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
                  <td colSpan={6} className="px-4 py-6 text-center text-ink-soft">No passes purchased yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
