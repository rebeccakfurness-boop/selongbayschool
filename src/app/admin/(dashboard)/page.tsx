import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import NewActivityCelebration from '@/components/admin/NewActivityCelebration';

export const dynamic = 'force-dynamic';

interface StatCard {
  label: string;
  value: number;
  href: string;
}

export default async function AdminOverviewPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();

  const [totalRegistered] = (await sql`SELECT COUNT(*)::int AS count FROM children`) as unknown as { count: number }[];
  const [active] = (await sql`SELECT COUNT(*)::int AS count FROM children WHERE is_active = true`) as unknown as { count: number }[];
  const [inactive] = (await sql`SELECT COUNT(*)::int AS count FROM children WHERE is_active = false`) as unknown as { count: number }[];
  const [waitlist] = (await sql`SELECT COUNT(*)::int AS count FROM children WHERE status = 'booking_waitlist'`) as unknown as { count: number }[];

  const familyStats: StatCard[] = [
    { label: 'Total registered', value: totalRegistered.count, href: '/admin/families' },
    { label: 'Active', value: active.count, href: '/admin/families' },
    { label: 'Inactive', value: inactive.count, href: '/admin/families' },
    { label: 'Waitlist', value: waitlist.count, href: '/admin/families' },
  ];

  if (staff.role === 'teacher') {
    return (
      <div className="flex flex-col gap-10">
        <section>
          <h1 className="font-display text-2xl font-semibold text-ink">Overview</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
            Welcome back. Head to the Family Board to see the children in your assigned classes.
          </p>
          <Link
            href="/admin/families"
            className="mt-6 inline-block rounded-full bg-teal px-6 py-3 text-sm font-bold text-white hover:bg-teal-deep"
          >
            Go to Family Board
          </Link>
        </section>
      </div>
    );
  }

  const [bookingsThisWeek] = (await sql`
    SELECT COUNT(*)::int AS count
    FROM bookings b
    JOIN sessions s ON s.id = b.slot_id
    WHERE date_trunc('week', s.session_date) = date_trunc('week', CURRENT_DATE)
      AND b.status != 'cancelled'
  `) as unknown as { count: number }[];

  const [unreadEnquiries] = (await sql`
    SELECT COUNT(*)::int AS count FROM enquiries WHERE is_read = false
  `) as unknown as { count: number }[];

  const [sessionsToday] = (await sql`
    SELECT COUNT(*)::int AS count FROM sessions WHERE session_date = CURRENT_DATE AND status = 'active'
  `) as unknown as { count: number }[];

  const stats: StatCard[] = [
    { label: 'Bookings this week', value: bookingsThisWeek.count, href: '/admin/bookings' },
    { label: 'Unread website enquiries', value: unreadEnquiries.count, href: '/admin/enquiries' },
    { label: 'Upcoming sessions today', value: sessionsToday.count, href: '/admin/activities' },
  ];

  return (
    <div className="flex flex-col gap-10">
      <NewActivityCelebration />
      <section>
        <h1 className="font-display text-2xl font-semibold text-ink">Overview</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          Welcome to your admin dashboard for Selong Bay School. Here, you can manage the family
          board, class forecast, activity bookings, and school enquiries.
        </p>

        <p className="mt-6 text-sm font-bold uppercase tracking-wide text-ink-soft">Enrolment overview</p>
        <div className="mt-3 grid gap-5 sm:grid-cols-4">
          {familyStats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-md border border-sand-line bg-paper p-6 shadow-soft transition-transform hover:-translate-y-0.5"
            >
              <div className="font-display text-4xl font-semibold text-teal-deep">{stat.value}</div>
              <div className="mt-2 text-sm font-semibold text-ink-soft">{stat.label}</div>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-sm font-bold uppercase tracking-wide text-ink-soft">Activities snapshot</p>
        <div className="mt-3 grid gap-5 sm:grid-cols-3">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-md border border-sand-line bg-paper p-6 shadow-soft transition-transform hover:-translate-y-0.5"
            >
              <div className="font-display text-4xl font-semibold text-teal-deep">{stat.value}</div>
              <div className="mt-2 text-sm font-semibold text-ink-soft">{stat.label}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-ink">Quick links</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/admin/families" className="rounded-full border border-sand-line bg-paper px-5 py-2 text-sm font-semibold text-ink hover:border-teal">
            Family Board
          </Link>
          <Link href="/admin/families/enquiries" className="rounded-full border border-sand-line bg-paper px-5 py-2 text-sm font-semibold text-ink hover:border-teal">
            Admissions pipeline
          </Link>
          <Link href="/admin/activities" className="rounded-full border border-sand-line bg-paper px-5 py-2 text-sm font-semibold text-ink hover:border-teal">
            Manage sessions
          </Link>
          <Link href="/admin/bookings" className="rounded-full border border-sand-line bg-paper px-5 py-2 text-sm font-semibold text-ink hover:border-teal">
            View all bookings
          </Link>
          <Link href="/admin/enquiries" className="rounded-full border border-sand-line bg-paper px-5 py-2 text-sm font-semibold text-ink hover:border-teal">
            View website enquiries
          </Link>
        </div>
      </section>
    </div>
  );
}
