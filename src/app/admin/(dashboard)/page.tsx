import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import NewActivityCelebration from '@/components/admin/NewActivityCelebration';

export const dynamic = 'force-dynamic';

interface StatCard {
  label: string;
  value: number;
  href: string;
}

export default async function AdminOverviewPage() {
  await ensureSchema();

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
    { label: 'Unread enquiries', value: unreadEnquiries.count, href: '/admin/enquiries' },
    { label: 'Upcoming sessions today', value: sessionsToday.count, href: '/admin/activities' },
  ];

  return (
    <div className="flex flex-col gap-10">
      <NewActivityCelebration />
      <section>
        <h1 className="font-display text-2xl font-semibold text-ink">Overview</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          Welcome to your admin dashboard for Selong Bay School. Here, you can manage activity
          bookings and the session calendar, activity packs, and school enquiries from the
          website&apos;s contact and admissions forms, with the ability to request website
          updates yourself coming soon.
        </p>
        <p className="mt-4 text-sm text-ink-soft">A quick snapshot of what&apos;s happening across the school:</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
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
          <Link href="/admin/activities" className="rounded-full border border-sand-line bg-paper px-5 py-2 text-sm font-semibold text-ink hover:border-teal">
            Manage sessions
          </Link>
          <Link href="/admin/bookings" className="rounded-full border border-sand-line bg-paper px-5 py-2 text-sm font-semibold text-ink hover:border-teal">
            View all bookings
          </Link>
          <Link href="/admin/enquiries" className="rounded-full border border-sand-line bg-paper px-5 py-2 text-sm font-semibold text-ink hover:border-teal">
            View all enquiries
          </Link>
        </div>
      </section>
    </div>
  );
}
