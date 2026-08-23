import { cookies } from 'next/headers';
import Link from 'next/link';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { getChildrenForGuardian } from '@/lib/lms-data';
import { getTodayDailyStatusForChildren } from '@/lib/attendance';
import { formatIDR } from '@/lib/site-content';
import { formatDate } from '@/lib/admin-format';
import { weekdaysSummaryLabel } from '@/lib/lunch-calc';
import { STATUS_LEGEND, type ChildStatus } from '@/lib/family-data';
import AccountNav from '@/components/account/AccountNav';
import ChildAvatar from '@/components/ChildAvatar';
import AttendanceActionButton from '@/components/account/AttendanceActionButton';

export const dynamic = 'force-dynamic';

/** Same pattern as the per-page error boundary on /account/learning (LearningPageLoadError) —
 * renders inline instead of throwing up to the site-wide boundary, which strips the real message
 * in production. This is the parent's own overview data, never anything about another family. */
function OverviewLoadError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-ink">My Account</h1>
      <div className="mt-6 rounded-md border border-orange-deep/40 bg-orange/10 p-5">
        <p className="font-semibold text-orange-deep">This page couldn&apos;t load.</p>
        <p className="mt-2 text-sm text-ink-soft">Please share this message with the school office so it can be fixed:</p>
        <pre className="mt-3 overflow-x-auto rounded-sm bg-ink/5 p-3 text-xs text-ink">{message}</pre>
      </div>
    </div>
  );
}

interface OutstandingInvoiceRow {
  id: number;
  invoice_number: number;
  invoice_type: 'tuition' | 'activity' | 'lunch';
  due_date: string;
  total_amount: number;
  days_overdue: number;
}

interface UpcomingLunchRow {
  id: number;
  child_id: number;
  child_full_name: string;
  start_date: string | null;
  end_date: string | null;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  lunch_size: 'normal' | 'large' | null;
}

interface UpcomingBookingRow {
  id: number;
  activity_name: string;
  slot_date: string;
  slot_time: string;
  status: string;
  child_name: string;
}

const INVOICE_TYPE_LABELS: Record<string, string> = {
  tuition: 'Tuition',
  activity: 'Activity',
  lunch: 'Lunch',
};

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  pay_at_session: 'Pay at session',
  paid: 'Paid',
};

export default async function AccountOverviewPage() {
  try {
    const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
    const customerId = session.customerId;

    await ensureSchema();
    const kids = customerId ? await getChildrenForGuardian(customerId) : [];
    const attendanceStatusMap = await getTodayDailyStatusForChildren(kids.map((k) => k.id));

    const outstandingInvoices = customerId
      ? ((await sql`
          SELECT DISTINCT i.id, i.invoice_number, i.invoice_type, i.due_date::text, i.total_amount,
            GREATEST(0, (CURRENT_DATE - i.due_date))::int AS days_overdue
          FROM invoices i
          JOIN invoice_children ic ON ic.invoice_id = i.id
          JOIN guardian_children gc ON gc.child_id = ic.child_id
          WHERE gc.customer_id = ${customerId} AND i.status = 'outstanding'
          ORDER BY i.due_date::text ASC
        `) as unknown as OutstandingInvoiceRow[])
      : [];
    const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const overdueCount = outstandingInvoices.filter((inv) => inv.days_overdue > 0).length;

    const upcomingLunches = customerId
      ? ((await sql`
          SELECT lo.id, lo.child_id, c.child_full_name, lo.start_date::text, lo.end_date::text,
            lo.monday, lo.tuesday, lo.wednesday, lo.thursday, lo.friday, lo.lunch_size
          FROM lunch_orders lo
          JOIN guardian_children gc ON gc.child_id = lo.child_id
          JOIN children c ON c.id = lo.child_id
          WHERE gc.customer_id = ${customerId} AND lo.own_lunch = false AND lo.end_date >= CURRENT_DATE
          ORDER BY lo.start_date ASC
        `) as unknown as UpcomingLunchRow[])
      : [];

    const upcomingBookings = customerId
      ? ((await sql`
          SELECT b.id, b.activity_name, s.session_date::text AS slot_date, s.session_time AS slot_time,
            b.status, b.child_name
          FROM bookings b
          JOIN sessions s ON s.id = b.slot_id
          WHERE b.customer_id = ${customerId} AND s.session_date >= CURRENT_DATE AND b.status != 'cancelled'
          ORDER BY s.session_date ASC, s.session_time ASC
          LIMIT 5
        `) as unknown as UpcomingBookingRow[])
      : [];

    return renderOverviewPage({
      email: session.email ?? '',
      kids,
      attendanceStatusMap,
      outstandingInvoices,
      totalOutstanding,
      overdueCount,
      upcomingBookings,
      upcomingLunches,
    });
  } catch (error) {
    console.error('[account] failed to load overview', error);
    return <OverviewLoadError error={error} />;
  }
}

function renderOverviewPage({
  email,
  kids,
  attendanceStatusMap,
  outstandingInvoices,
  totalOutstanding,
  overdueCount,
  upcomingBookings,
  upcomingLunches,
}: {
  email: string;
  kids: Awaited<ReturnType<typeof getChildrenForGuardian>>;
  attendanceStatusMap: Awaited<ReturnType<typeof getTodayDailyStatusForChildren>>;
  outstandingInvoices: OutstandingInvoiceRow[];
  totalOutstanding: number;
  overdueCount: number;
  upcomingBookings: UpcomingBookingRow[];
  upcomingLunches: UpcomingLunchRow[];
}) {
    return (
      <div className="min-h-screen bg-cream">
        <AccountNav active="/account" />

        <div className="mx-auto max-w-4xl px-6 py-10">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Welcome back</h1>
            <p className="mt-1 text-sm text-ink-soft">Signed in as {email}.</p>
          </div>

          {kids.length === 0 ? (
            <div className="mt-8 rounded-md border border-dashed border-sand-line bg-paper p-8 text-center">
              <p className="text-ink-soft">
                No children are linked to your account yet. Ask the school office to link your email to your
                child&apos;s record, or{' '}
                <Link href="/account/link-child" className="font-semibold text-teal-deep underline">
                  request a link yourself
                </Link>
                .
              </p>
            </div>
          ) : (
            <section className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-semibold text-ink">Your Children</h2>
                <Link href="/account/link-child" className="text-sm font-semibold text-teal-deep underline">
                  Link another child
                </Link>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {kids.map((child) => (
                  <div key={child.id} className="flex items-center gap-4 rounded-md border border-sand-line bg-paper p-4 shadow-soft">
                    <Link href={`/account/learning#child-${child.id}`} className="flex flex-1 items-center gap-4 hover:opacity-80">
                      <ChildAvatar photoUrl={child.photo_url} name={child.child_full_name} size="lg" />
                      <div>
                        <p className="font-display text-lg font-semibold text-ink">{child.child_nickname || child.child_full_name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_LEGEND[child.status as ChildStatus].badgeClass}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_LEGEND[child.status as ChildStatus].dotClass}`} />
                            {STATUS_LEGEND[child.status as ChildStatus].label}
                          </span>
                          {child.class_name && <span className="text-xs text-ink-soft">{child.class_name}</span>}
                        </div>
                      </div>
                    </Link>
                    {child.enrollment_type === 'regular' && (
                      <AttendanceActionButton
                        childId={child.id}
                        childName={child.child_nickname || child.child_full_name}
                        sessionType="daily"
                        currentEventType={attendanceStatusMap.get(child.id)?.event_type ?? null}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold text-ink">Invoices</h2>
              {totalOutstanding > 0 && (
                <span className={`text-sm font-bold ${overdueCount > 0 ? 'text-orange-deep' : 'text-ink'}`}>
                  {formatIDR(totalOutstanding)} outstanding
                  {overdueCount > 0 && ` · ${overdueCount} overdue`}
                </span>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {outstandingInvoices.length === 0 && <p className="text-sm text-ink-soft">Nothing outstanding: all invoices are paid up.</p>}
              {outstandingInvoices.map((inv) => (
                <a
                  key={inv.id}
                  href={`/api/invoices/${inv.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-md border border-sand-line bg-paper px-4 py-3 text-sm hover:border-teal/40"
                >
                  <span>
                    <span className="font-semibold text-ink">Invoice #{String(inv.invoice_number).padStart(3, '0')}</span>
                    <span className="ml-2 text-xs text-ink-soft">{INVOICE_TYPE_LABELS[inv.invoice_type]} · due {formatDate(inv.due_date)}</span>
                  </span>
                  <span className={inv.days_overdue > 0 ? 'font-bold text-orange-deep' : 'font-semibold text-ink'}>
                    {formatIDR(inv.total_amount)}
                    {inv.days_overdue > 0 && ` · ${inv.days_overdue}d overdue`}
                  </span>
                </a>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold text-ink">Booked Activities</h2>
              <Link href="/account/bookings" className="text-sm font-semibold text-teal-deep underline">
                View all
              </Link>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {upcomingBookings.length === 0 && <p className="text-sm text-ink-soft">No upcoming activities booked.</p>}
              {upcomingBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-md border border-sand-line bg-paper px-4 py-3 text-sm">
                  <span>
                    <span className="font-semibold text-ink">{b.activity_name}</span>
                    <span className="ml-2 text-xs text-ink-soft">{b.child_name} · {formatDate(b.slot_date)} · {b.slot_time}</span>
                  </span>
                  <span className="text-xs font-semibold text-ink-soft">{BOOKING_STATUS_LABELS[b.status] ?? b.status}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold text-ink">Lunch Orders</h2>
              <Link href="/account/learning" className="text-sm font-semibold text-teal-deep underline">
                Order lunches
              </Link>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {upcomingLunches.length === 0 && <p className="text-sm text-ink-soft">No upcoming lunch orders.</p>}
              {upcomingLunches.map((lo) => (
                <div key={lo.id} className="rounded-md border border-sand-line bg-paper px-4 py-3 text-sm">
                  <span className="font-semibold text-ink">{lo.child_full_name}</span>
                  <span className="ml-2 text-ink-soft capitalize">
                    {lo.lunch_size} · {weekdaysSummaryLabel({ monday: lo.monday, tuesday: lo.tuesday, wednesday: lo.wednesday, thursday: lo.thursday, friday: lo.friday })} ·{' '}
                    {lo.start_date && formatDate(lo.start_date)} – {lo.end_date && formatDate(lo.end_date)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
}
