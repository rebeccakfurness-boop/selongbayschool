import { ensureSchema, sql } from '@/lib/db';
import { formatDateTime } from '@/lib/admin-format';
import { formatIDR } from '@/lib/site-content';
import StatusPill from '@/components/admin/StatusPill';
import MarkPaidButton from '@/components/admin/MarkPaidButton';
import BookingsTabs from '@/components/admin/BookingsTabs';

export const dynamic = 'force-dynamic';

interface BookingRow {
  id: number;
  activity_slug: string;
  activity_name: string;
  slot_date: string;
  slot_time: string;
  child_name: string;
  child_age: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string | null;
  notify_email_status: string;
  status: string;
  payment_method: string | null;
  price_idr: number | null;
  price_note: string | null;
  created_at: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pay_online: 'Pay online',
  pay_at_session: 'Pay at session',
  pack_session: 'Activity pack',
};

function amountDue(row: Pick<BookingRow, 'price_idr' | 'price_note'>): string {
  if (row.price_idr) return formatIDR(row.price_idr);
  return row.price_note || '-';
}

interface ActivityOption {
  slug: string;
  name: string;
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

function BookingStatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[status] ?? 'bg-sand text-ink-soft'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; activity?: string; status?: string }>;
}) {
  await ensureSchema();
  const { q, activity, status } = await searchParams;
  const query = q?.trim() || null;
  const activityFilter = activity?.trim() || null;
  const statusFilter = status?.trim() || null;

  const activities = (await sql`
    SELECT slug, name FROM activities ORDER BY name ASC
  `) as unknown as ActivityOption[];

  const bookings = (await sql`
    SELECT b.id, b.activity_slug, b.activity_name, s.session_date::text AS slot_date, s.session_time AS slot_time,
           b.child_name, b.child_age, b.parent_name, b.parent_email, b.parent_phone,
           b.emergency_contact_name, b.emergency_contact_phone,
           b.notify_email_status, b.status, b.payment_method, act.price_idr, act.price_note, b.created_at
    FROM bookings b
    JOIN sessions s ON s.id = b.slot_id
    LEFT JOIN activities act ON act.slug = b.activity_slug
    WHERE
      (${query}::text IS NULL OR b.parent_name ILIKE '%' || ${query} || '%' OR b.parent_email ILIKE '%' || ${query} || '%' OR b.child_name ILIKE '%' || ${query} || '%')
      AND (${activityFilter}::text IS NULL OR b.activity_slug = ${activityFilter})
      AND (${statusFilter}::text IS NULL OR b.status = ${statusFilter})
    ORDER BY b.created_at DESC LIMIT 200
  `) as unknown as BookingRow[];

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">Bookings</h1>
        <BookingsTabs active="bookings" />
      </div>
      <p className="mt-1 text-sm text-ink-soft">{bookings.length} shown.</p>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3 rounded-md border border-sand-line bg-paper p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="bookings-q" className="text-xs font-bold text-ink-soft">Search customer</label>
          <input
            id="bookings-q"
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Name, email, or child"
            className="rounded-sm border border-sand-line bg-white px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="bookings-activity" className="text-xs font-bold text-ink-soft">Activity</label>
          <select
            id="bookings-activity"
            name="activity"
            defaultValue={activity ?? ''}
            className="rounded-sm border border-sand-line bg-white px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option value="">All activities</option>
            {activities.map((a) => (
              <option key={a.slug} value={a.slug}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="bookings-status" className="text-xs font-bold text-ink-soft">Status</label>
          <select
            id="bookings-status"
            name="status"
            defaultValue={status ?? ''}
            className="rounded-sm border border-sand-line bg-white px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option value="">All statuses</option>
            <option value="pending_payment">Pending payment</option>
            <option value="pay_at_session">Pay at session</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-full bg-teal px-5 py-2 text-sm font-bold text-white hover:bg-teal-deep"
        >
          Filter
        </button>
        {(q || activity || status) && (
          <a href="/admin/bookings" className="text-sm font-semibold text-ink-soft hover:underline">
            Clear
          </a>
        )}
      </form>

      <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
        <table className="w-full min-w-[1300px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">Booked</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Activity</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Date &amp; time</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Child</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Customer</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Emergency contact</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Amount due</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Payment method</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Status</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Email</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((row) => (
              <tr key={row.id} className="border-b border-sand-line/60 last:border-0 align-top">
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDateTime(row.created_at)}</td>
                <td className="px-4 py-3 font-semibold text-ink">{row.activity_name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{row.slot_date} &middot; {row.slot_time}</td>
                <td className="px-4 py-3 text-ink-soft">{row.child_name} ({row.child_age})</td>
                <td className="px-4 py-3 text-ink-soft">
                  <div>{row.parent_name}</div>
                  <div>{row.parent_email}</div>
                  <div>{row.parent_phone}</div>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  <div>{row.emergency_contact_name}</div>
                  <div>{row.emergency_contact_phone || '-'}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">{amountDue(row)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                  {row.payment_method ? PAYMENT_METHOD_LABELS[row.payment_method] ?? row.payment_method : '-'}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <BookingStatusPill status={row.status} />
                  {row.status === 'pending_payment' && (
                    <div className="mt-1">
                      <MarkPaidButton id={row.id} />
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusPill status={row.notify_email_status} />
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-ink-soft">No bookings match these filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
