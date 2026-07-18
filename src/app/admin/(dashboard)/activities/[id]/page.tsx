import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import MarkPaidButton from '@/components/admin/MarkPaidButton';
import CancelSessionButton from '@/components/admin/CancelSessionButton';
import ActivityEditForm, { type ActivityDetail } from '@/components/admin/ActivityEditForm';

export const dynamic = 'force-dynamic';

interface SessionBookingRow {
  session_id: number;
  session_date: string;
  session_time: string;
  capacity: number;
  spots_remaining: number;
  session_status: string;
  booking_id: number | null;
  child_name: string | null;
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  payment_method: string | null;
  booking_status: string | null;
}

interface SessionGroup {
  id: number;
  date: string;
  time: string;
  capacity: number;
  spotsRemaining: number;
  status: string;
  bookings: Array<{
    id: number;
    childName: string;
    parentName: string;
    parentEmail: string;
    parentPhone: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    paymentMethod: string | null;
    status: string;
  }>;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pay_online: 'Pay online',
  pay_at_session: 'Pay at session',
  pack_session: 'Activity pack',
};

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

function groupSessions(rows: SessionBookingRow[]): SessionGroup[] {
  const map = new Map<number, SessionGroup>();
  for (const row of rows) {
    let group = map.get(row.session_id);
    if (!group) {
      group = {
        id: row.session_id,
        date: row.session_date,
        time: row.session_time,
        capacity: row.capacity,
        spotsRemaining: row.spots_remaining,
        status: row.session_status,
        bookings: [],
      };
      map.set(row.session_id, group);
    }
    if (row.booking_id) {
      group.bookings.push({
        id: row.booking_id,
        childName: row.child_name ?? '',
        parentName: row.parent_name ?? '',
        parentEmail: row.parent_email ?? '',
        parentPhone: row.parent_phone ?? '',
        emergencyContactName: row.emergency_contact_name ?? '',
        emergencyContactPhone: row.emergency_contact_phone ?? '',
        paymentMethod: row.payment_method,
        status: row.booking_status ?? '',
      });
    }
  }
  return Array.from(map.values());
}

function SessionCard({ session, activityName }: { session: SessionGroup; activityName: string }) {
  const filled = session.capacity - session.spotsRemaining;
  return (
    <div className="rounded-md border border-sand-line bg-paper p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">
            {session.date} &middot; {session.time}
          </h3>
          <p className="mt-1 text-sm text-ink-soft">
            {filled} of {session.capacity} spots filled
            {session.status === 'cancelled' && (
              <span className="ml-2 rounded-full bg-orange/20 px-2 py-0.5 text-xs font-bold text-orange-deep">Cancelled</span>
            )}
          </p>
        </div>
        {session.status === 'active' && (
          <CancelSessionButton sessionId={session.id} activityName={activityName} date={session.date} time={session.time} />
        )}
      </div>

      {session.bookings.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">No bookings for this session yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-md border border-sand-line">
          <table className="w-full min-w-[850px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-sand-line bg-sand/40 text-left">
                <th className="px-3 py-2 font-bold text-ink-soft">Child</th>
                <th className="px-3 py-2 font-bold text-ink-soft">Parent</th>
                <th className="px-3 py-2 font-bold text-ink-soft">Contact</th>
                <th className="px-3 py-2 font-bold text-ink-soft">Emergency contact</th>
                <th className="px-3 py-2 font-bold text-ink-soft">Payment method</th>
                <th className="px-3 py-2 font-bold text-ink-soft">Status</th>
              </tr>
            </thead>
            <tbody>
              {session.bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-sand-line/60 last:border-0 align-top">
                  <td className="px-3 py-2 text-ink">{booking.childName}</td>
                  <td className="px-3 py-2 text-ink-soft">{booking.parentName}</td>
                  <td className="px-3 py-2 text-ink-soft">
                    <div>{booking.parentEmail}</div>
                    <div>{booking.parentPhone}</div>
                  </td>
                  <td className="px-3 py-2 text-ink-soft">
                    <div>{booking.emergencyContactName}</div>
                    <div>{booking.emergencyContactPhone || '-'}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-ink-soft">
                    {booking.paymentMethod ? PAYMENT_METHOD_LABELS[booking.paymentMethod] ?? booking.paymentMethod : '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_STYLES[booking.status] ?? 'bg-sand text-ink-soft'}`}>
                      {STATUS_LABELS[booking.status] ?? booking.status}
                    </span>
                    {booking.status === 'pending_payment' && (
                      <div className="mt-1">
                        <MarkPaidButton id={booking.id} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default async function AdminActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const { id } = await params;
  const activityId = Number(id);
  if (!Number.isInteger(activityId)) {
    notFound();
  }

  const [activity] = (await sql`
    SELECT id, name, day, duration, price_idr, price_note, default_time, default_capacity, is_active, photo_url, description, age_group
    FROM activities WHERE id = ${activityId}
  `) as unknown as ActivityDetail[];

  if (!activity) {
    notFound();
  }

  // Bounded to the last 90 days of past sessions (plus every upcoming one) so this page doesn't
  // keep growing unbounded for an activity that's run for years.
  const rows = (await sql`
    SELECT s.id AS session_id, s.session_date::text AS session_date, s.session_time,
           s.capacity, s.spots_remaining, s.status AS session_status,
           b.id AS booking_id, b.child_name, b.parent_name, b.parent_email, b.parent_phone,
           b.emergency_contact_name, b.emergency_contact_phone,
           b.payment_method, b.status AS booking_status
    FROM sessions s
    LEFT JOIN bookings b ON b.slot_id = s.id AND b.status != 'cancelled'
    WHERE s.activity_id = ${activityId} AND s.session_date >= CURRENT_DATE - INTERVAL '90 days'
    ORDER BY s.session_date ASC, s.session_time ASC, b.id ASC
  `) as unknown as SessionBookingRow[];

  const sessions = groupSessions(rows);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = sessions.filter((s) => s.date >= today);
  const past = sessions.filter((s) => s.date < today).reverse();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/activities" className="text-sm font-semibold text-teal-deep hover:underline">
          &larr; All activities
        </Link>
      </div>

      <ActivityEditForm activity={activity} />

      <section>
        <h2 className="font-display text-xl font-semibold text-ink">Upcoming sessions</h2>
        <div className="mt-4 flex flex-col gap-4">
          {upcoming.length === 0 && <p className="text-sm text-ink-soft">No upcoming sessions scheduled.</p>}
          {upcoming.map((session) => (
            <SessionCard key={session.id} session={session} activityName={activity.name} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-ink">Past sessions</h2>
        <div className="mt-4 flex flex-col gap-4">
          {past.length === 0 && <p className="text-sm text-ink-soft">No past sessions in the last 90 days.</p>}
          {past.map((session) => (
            <SessionCard key={session.id} session={session} activityName={activity.name} />
          ))}
        </div>
      </section>
    </div>
  );
}
