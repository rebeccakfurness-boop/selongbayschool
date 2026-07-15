import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { formatIDR } from '@/lib/site-content';
import LogoutButton from '@/components/account/LogoutButton';

export const dynamic = 'force-dynamic';

interface BookingRow {
  id: number;
  activity_name: string;
  slot_date: string;
  slot_time: string;
  status: string;
  payment_method: string | null;
  price_idr: number | null;
  price_note: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  pay_at_session: 'Pay at session',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

const STATUS_STYLES: Record<string, string> = {
  pending_payment: 'bg-orange/20 text-orange-deep',
  pay_at_session: 'bg-sand text-ink-soft',
  paid: 'bg-teal/15 text-teal-deep',
  cancelled: 'bg-black/10 text-ink-soft',
};

function BookingCard({ booking }: { booking: BookingRow }) {
  const amount = booking.price_idr ? formatIDR(booking.price_idr) : booking.price_note;
  return (
    <div className="rounded-md border border-sand-line bg-paper p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">{booking.activity_name}</h3>
          <p className="mt-1 text-sm text-ink-soft">{booking.slot_date} &middot; {booking.slot_time}</p>
        </div>
        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[booking.status] ?? 'bg-sand text-ink-soft'}`}>
          {STATUS_LABELS[booking.status] ?? booking.status}
        </span>
      </div>
      {amount && <p className="mt-3 text-sm font-semibold text-ink">{amount}</p>}
    </div>
  );
}

export default async function AccountBookingsPage() {
  // The proxy already redirects unauthenticated visitors to /account/login before this
  // page renders, but the query below is scoped by session.customerId regardless, so a
  // customer can never see another customer's bookings even if that redirect were bypassed.
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  const customerId = session.customerId;

  await ensureSchema();
  const bookings = customerId
    ? ((await sql`
        SELECT b.id, b.activity_name, s.session_date::text AS slot_date, s.session_time AS slot_time,
               b.status, b.payment_method, act.price_idr, act.price_note
        FROM bookings b
        JOIN sessions s ON s.id = b.slot_id
        LEFT JOIN activities act ON act.slug = b.activity_slug
        WHERE b.customer_id = ${customerId}
        ORDER BY s.session_date DESC, s.session_time DESC
      `) as unknown as BookingRow[])
    : [];

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => b.slot_date >= today && b.status !== 'cancelled');
  const past = bookings.filter((b) => b.slot_date < today || b.status === 'cancelled');

  return (
    <div className="min-h-screen bg-cream">
      <div className="border-b border-black/10 bg-teal-deep">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-semibold text-white">My Account</span>
          <LogoutButton />
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">My Bookings</h1>
        <p className="mt-1 text-sm text-ink-soft">Signed in as {session.email}.</p>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-ink">Upcoming</h2>
          <div className="mt-4 flex flex-col gap-4">
            {upcoming.length === 0 && <p className="text-sm text-ink-soft">No upcoming bookings.</p>}
            {upcoming.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-ink">Past</h2>
          <div className="mt-4 flex flex-col gap-4">
            {past.length === 0 && <p className="text-sm text-ink-soft">No past bookings yet.</p>}
            {past.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
