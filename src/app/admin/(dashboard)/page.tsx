import Link from 'next/link';
import Image from 'next/image';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { formatDate, formatDateTime } from '@/lib/admin-format';
import { formatIDR } from '@/lib/site-content';
import { CLASS_BAND_LABELS, CLASS_BAND_ORDER, ENQUIRY_SOURCE_LABELS, type ClassBand } from '@/lib/family-data';
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

  const byClass = (await sql`
    SELECT COALESCE(class_name, 'No class set') AS class_name, COUNT(*)::int AS count
    FROM children WHERE is_active = true
    GROUP BY class_name ORDER BY class_name
  `) as unknown as { class_name: string; count: number }[];

  const byProgramme = (await sql`
    SELECT class_band, COUNT(*)::int AS count
    FROM children WHERE is_active = true
    GROUP BY class_band
  `) as unknown as { class_band: ClassBand | null; count: number }[];
  const byProgrammeMap = new Map(byProgramme.map((r) => [r.class_band, r.count]));

  const [formsOutstanding] = (await sql`
    SELECT
      COUNT(*) FILTER (WHERE NOT liability_form_signed)::int AS liability,
      COUNT(*) FILTER (WHERE NOT photography_signed)::int AS photography,
      COUNT(*) FILTER (WHERE NOT pickup_authorization_signed)::int AS pickup,
      COUNT(*) FILTER (WHERE NOT behavioral_form_signed)::int AS behavioral,
      COUNT(*) FILTER (WHERE NOT financial_agreement_signed)::int AS financial,
      COUNT(*) FILTER (WHERE NOT parent_protection_addendum_signed)::int AS parent_protection,
      COUNT(*) FILTER (WHERE NOT data_consent_signed)::int AS data_consent
    FROM children WHERE is_active = true
  `) as unknown as {
    liability: number; photography: number; pickup: number; behavioral: number; financial: number;
    parent_protection: number; data_consent: number;
  }[];
  const formsOutstandingItems = [
    { label: 'Liability Form', count: formsOutstanding.liability },
    { label: 'Photography / Social Media', count: formsOutstanding.photography },
    { label: 'Pickup Authorization', count: formsOutstanding.pickup },
    { label: 'Behavioral / Code of Conduct', count: formsOutstanding.behavioral },
    { label: 'Financial Agreement', count: formsOutstanding.financial },
    { label: 'Parent Protection Addendum', count: formsOutstanding.parent_protection },
    { label: 'Personal Data Consent (UU 27/2022)', count: formsOutstanding.data_consent },
  ];

  const [{ count: enquiryCount }] = (await sql`SELECT COUNT(*)::int AS count FROM admissions_enquiries`) as unknown as { count: number }[];
  const enquiriesBySource = (await sql`
    SELECT source, COUNT(*)::int AS count FROM admissions_enquiries GROUP BY source ORDER BY count DESC
  `) as unknown as { source: string; count: number }[];

  const [{ count: onSiteToday }] = (await sql`
    SELECT COUNT(*)::int AS count FROM children
    WHERE is_active = true
      AND (enrolment_date IS NULL OR enrolment_date <= CURRENT_DATE)
      AND (exit_date IS NULL OR exit_date >= CURRENT_DATE)
  `) as unknown as { count: number }[];

  const [invoiceSummary] = (await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'outstanding')::int AS outstanding_count,
      COALESCE(SUM(total_amount) FILTER (WHERE status = 'outstanding'), 0)::bigint AS outstanding_total,
      COUNT(*) FILTER (WHERE status = 'outstanding' AND due_date < CURRENT_DATE)::int AS overdue_count
    FROM invoices
  `) as unknown as { outstanding_count: number; outstanding_total: number; overdue_count: number }[];

  const forecastRows = (await sql`
    SELECT forecast_month, class_band, COUNT(*)::int AS count
    FROM class_forecast_entries
    GROUP BY forecast_month, class_band
    ORDER BY forecast_month
  `) as unknown as { forecast_month: string; class_band: ClassBand; count: number }[];
  const forecastMonths = Array.from(new Set(forecastRows.map((r) => r.forecast_month)));

  const recentLessonPlans = (await sql`
    SELECT lp.title, lp.class_name, lp.created_at, COALESCE(au.display_name, au.email) AS teacher_label
    FROM lesson_plans lp LEFT JOIN admin_users au ON au.id = lp.teacher_id
    ORDER BY lp.created_at DESC LIMIT 5
  `) as unknown as { title: string; class_name: string; created_at: string; teacher_label: string | null }[];

  const recentWorkSamples = (await sql`
    SELECT w.title, w.created_at, COALESCE(c.child_nickname, c.child_full_name) AS child_label
    FROM work_samples w JOIN children c ON c.id = w.child_id
    ORDER BY w.created_at DESC LIMIT 5
  `) as unknown as { title: string; created_at: string; child_label: string }[];

  const recentPhotos = (await sql`
    SELECT file_url, caption, created_at FROM photo_feed_items ORDER BY created_at DESC LIMIT 6
  `) as unknown as { file_url: string; caption: string | null; created_at: string }[];

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

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold text-ink">By Class</h2>
            <ul className="mt-3 flex flex-col gap-1.5">
              {byClass.map((row) => (
                <li key={row.class_name} className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{row.class_name}</span>
                  <span className="font-bold text-ink">{row.count}</span>
                </li>
              ))}
              {byClass.length === 0 && <li className="text-sm text-ink-soft">No active children yet.</li>}
            </ul>
          </div>

          <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold text-ink">By Programme</h2>
            <ul className="mt-3 flex flex-col gap-1.5">
              {CLASS_BAND_ORDER.map((band) => (
                <li key={band} className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{CLASS_BAND_LABELS[band]}</span>
                  <span className="font-bold text-ink">{byProgrammeMap.get(band) ?? 0}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft lg:col-span-2">
            <h2 className="font-display text-lg font-semibold text-ink">Forms Outstanding (Not Yet Signed)</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {formsOutstandingItems.map((item) => (
                <div key={item.label} className={`rounded-sm px-3 py-2 text-sm ${item.count > 0 ? 'bg-orange/10 text-orange-deep' : 'bg-teal/10 text-teal-deep'}`}>
                  <div className="font-bold">{item.count}</div>
                  <div className="text-xs">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <Link href="/admin/families/enquiries" className="rounded-md border border-sand-line bg-paper p-6 shadow-soft transition-transform hover:-translate-y-0.5">
            <div className="font-display text-4xl font-semibold text-teal-deep">{enquiryCount}</div>
            <div className="mt-2 text-sm font-semibold text-ink-soft">Admissions leads</div>
            <div className="mt-1 text-xs text-ink-soft">
              {enquiriesBySource.map((s) => `${ENQUIRY_SOURCE_LABELS[s.source] || s.source} (${s.count})`).join(' · ')}
            </div>
          </Link>
          <Link href="/admin/families/calendar" className="rounded-md border border-sand-line bg-paper p-6 shadow-soft transition-transform hover:-translate-y-0.5">
            <div className="font-display text-4xl font-semibold text-teal-deep">{onSiteToday}</div>
            <div className="mt-2 text-sm font-semibold text-ink-soft">On site today</div>
          </Link>
          <Link href="/admin/invoices" className="rounded-md border border-sand-line bg-paper p-6 shadow-soft transition-transform hover:-translate-y-0.5">
            <div className="font-display text-4xl font-semibold text-teal-deep">{formatIDR(invoiceSummary.outstanding_total)}</div>
            <div className="mt-2 text-sm font-semibold text-ink-soft">
              Outstanding across {invoiceSummary.outstanding_count} invoice{invoiceSummary.outstanding_count === 1 ? '' : 's'}
            </div>
            {invoiceSummary.overdue_count > 0 && (
              <div className="mt-1 text-xs font-bold text-orange-deep">{invoiceSummary.overdue_count} overdue</div>
            )}
          </Link>
        </div>

        {forecastMonths.length > 0 && (
          <div className="mt-8 rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Class Forecast</h2>
              <Link href="/admin/families/forecast" className="text-sm font-semibold text-teal-deep hover:underline">
                View full forecast →
              </Link>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-soft">
                    <th className="py-1 pr-4">Month</th>
                    {CLASS_BAND_ORDER.map((band) => (
                      <th key={band} className="py-1 pr-4">{CLASS_BAND_LABELS[band]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {forecastMonths.map((month) => (
                    <tr key={month}>
                      <td className="py-1 pr-4 font-semibold text-ink">{month}</td>
                      {CLASS_BAND_ORDER.map((band) => (
                        <td key={band} className="py-1 pr-4 text-ink-soft">
                          {forecastRows.find((r) => r.forecast_month === month && r.class_band === band)?.count ?? 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold text-ink">Teacher Activity</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {recentLessonPlans.map((lp, i) => (
                <li key={i} className="text-sm">
                  <span className="font-semibold text-ink">{lp.title}</span>
                  <span className="ml-2 text-xs text-ink-soft">
                    {lp.class_name} · {lp.teacher_label || 'Unknown'} · {formatDateTime(lp.created_at)}
                  </span>
                </li>
              ))}
              {recentWorkSamples.map((w, i) => (
                <li key={`ws-${i}`} className="text-sm">
                  <span className="font-semibold text-ink">Work sample: {w.title}</span>
                  <span className="ml-2 text-xs text-ink-soft">{w.child_label} · {formatDateTime(w.created_at)}</span>
                </li>
              ))}
              {recentLessonPlans.length === 0 && recentWorkSamples.length === 0 && (
                <li className="text-sm text-ink-soft">No recent activity yet.</li>
              )}
            </ul>
          </div>

          <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold text-ink">Recent Photos</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {recentPhotos.map((p, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-sand-line">
                  <Image src={p.file_url} alt={p.caption || ''} fill sizes="120px" className="object-cover" />
                </div>
              ))}
              {recentPhotos.length === 0 && <p className="col-span-3 text-sm text-ink-soft">No photos uploaded yet.</p>}
            </div>
          </div>
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
          <Link href="/admin/invoices" className="rounded-full border border-sand-line bg-paper px-5 py-2 text-sm font-semibold text-ink hover:border-teal">
            Invoices
          </Link>
          <Link href="/admin/classroom" className="rounded-full border border-sand-line bg-paper px-5 py-2 text-sm font-semibold text-ink hover:border-teal">
            Google Classroom
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
