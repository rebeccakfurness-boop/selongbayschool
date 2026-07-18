import { cookies } from 'next/headers';
import Link from 'next/link';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { formatIDR } from '@/lib/site-content';
import LogoutButton from '@/components/account/LogoutButton';
import CancelBookingButton from '@/components/account/CancelBookingButton';

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

interface PassRow {
  id: number;
  child_name: string;
  total_sessions: number;
  sessions_used: number;
  expires_at: string;
  status: string;
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

const PASS_STATUS_LABELS: Record<string, string> = {
  ...STATUS_LABELS,
  expired: 'Expired',
};

const PASS_STATUS_STYLES: Record<string, string> = {
  ...STATUS_STYLES,
  expired: 'bg-black/10 text-ink-soft',
};

function BookingCard({ booking, showCancel }: { booking: BookingRow; showCancel?: boolean }) {
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
      {showCancel && (
        <CancelBookingButton bookingId={booking.id} activityName={booking.activity_name} date={booking.slot_date} />
      )}
    </div>
  );
}

function PassCard({ pass }: { pass: PassRow }) {
  const expiresLabel = new Date(pass.expires_at).toLocaleDateString('en-AU', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Makassar',
  });
  return (
    <div className="rounded-md border border-sand-line bg-paper p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">{pass.child_name}</h3>
          <p className="mt-1 text-sm text-ink-soft">
            {pass.total_sessions - pass.sessions_used} of {pass.total_sessions} sessions remaining
          </p>
        </div>
        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${PASS_STATUS_STYLES[pass.status] ?? 'bg-sand text-ink-soft'}`}>
          {PASS_STATUS_LABELS[pass.status] ?? pass.status}
        </span>
      </div>
      <p className="mt-3 text-sm text-ink-soft">Expires {expiresLabel}</p>
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

  const passes = customerId
    ? ((await sql`
        SELECT id, child_name, total_sessions, sessions_used, expires_at, status
        FROM passes
        WHERE customer_id = ${customerId}
        ORDER BY purchased_at DESC
      `) as unknown as PassRow[])
    : [];

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => b.slot_date >= today && b.status !== 'cancelled');
  const past = bookings.filter((b) => b.slot_date < today || b.status === 'cancelled');

  return (
    <div className="min-h-screen bg-cream">
      <div className="border-b border-black/10 bg-teal-deep">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-semibold text-white">My Account</span>
          <div className="flex items-center gap-4">
            <Link href="/account/settings" className="text-sm font-semibold text-white/90 hover:underline">
              Settings
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">My Bookings</h1>
            <p className="mt-1 text-sm text-ink-soft">Signed in as {session.email}.</p>
          </div>
          <Link
            href="/account/buy-pack"
            className="rounded-full bg-orange px-5 py-2.5 text-sm font-extrabold text-[#46280a] hover:bg-orange-deep hover:text-white"
          >
            Buy an Activity Pack
          </Link>
        </div>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-ink">My Packs</h2>
          <div className="mt-4 flex flex-col gap-4">
            {passes.length === 0 && <p className="text-sm text-ink-soft">No activity packs yet.</p>}
            {passes.map((pass) => (
              <PassCard key={pass.id} pass={pass} />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-ink">Upcoming</h2>
          <div className="mt-4 flex flex-col gap-4">
            {upcoming.length === 0 && <p className="text-sm text-ink-soft">No upcoming bookings.</p>}
            {upcoming.map((booking) => (
              <BookingCard key={booking.id} booking={booking} showCancel />
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
