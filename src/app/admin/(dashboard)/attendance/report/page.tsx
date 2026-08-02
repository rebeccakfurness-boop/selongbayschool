import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getAttendanceReport, schoolLocalToday } from '@/lib/attendance';
import { formatDateTime } from '@/lib/admin-format';

export const dynamic = 'force-dynamic';

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default async function AttendanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; class?: string }>;
}) {
  await requireAdmin();
  await ensureSchema();

  const params = await searchParams;
  const from = params.from || daysAgo(30);
  const to = params.to || schoolLocalToday();
  const classFilter = params.class || '';

  const [rows, classOptions] = await Promise.all([
    getAttendanceReport({ from, to, classFilter: classFilter || null }),
    sql`SELECT DISTINCT class_name FROM children WHERE class_name IS NOT NULL ORDER BY class_name` as unknown as Promise<{ class_name: string }[]>,
  ]);

  const exportHref = `/api/admin/attendance/export?from=${from}&to=${to}${classFilter ? `&class=${encodeURIComponent(classFilter)}` : ''}`;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Attendance Reports</h1>
          <p className="mt-1 text-sm text-ink-soft">{rows.length} record{rows.length === 1 ? '' : 's'} in range.</p>
        </div>
        <Link href="/admin/attendance" className="text-sm font-semibold text-teal-deep hover:underline">
          Back to today
        </Link>
      </div>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3 rounded-md border border-sand-line bg-paper p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="att-from" className="text-xs font-bold text-ink-soft">From</label>
          <input id="att-from" type="date" name="from" defaultValue={from} className="rounded-sm border border-sand-line bg-white px-3 py-2 text-sm text-ink" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="att-to" className="text-xs font-bold text-ink-soft">To</label>
          <input id="att-to" type="date" name="to" defaultValue={to} className="rounded-sm border border-sand-line bg-white px-3 py-2 text-sm text-ink" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="att-class" className="text-xs font-bold text-ink-soft">Class</label>
          <select id="att-class" name="class" defaultValue={classFilter} className="rounded-sm border border-sand-line bg-white px-3 py-2 text-sm text-ink">
            <option value="">All classes</option>
            {classOptions.map((c) => (
              <option key={c.class_name} value={c.class_name}>{c.class_name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-full bg-teal px-5 py-2 text-sm font-bold text-white hover:bg-teal-deep">
          Filter
        </button>
        <a href={exportHref} className="rounded-full border border-teal px-5 py-2 text-sm font-bold text-teal-deep hover:bg-teal/10">
          Export CSV
        </a>
      </form>

      <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-paper">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">Student</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Class</th>
              <th className="px-4 py-3 font-bold text-ink-soft">When</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Type</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Session</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Source</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Performed by</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-sand-line/60 last:border-0 align-top hover:bg-sand/20">
                <td className="px-4 py-3 font-semibold text-ink">{r.child_full_name}</td>
                <td className="px-4 py-3 text-ink-soft">{r.class_name ?? '-'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDateTime(r.occurred_at)}</td>
                <td className="px-4 py-3 text-ink-soft">{r.event_type === 'check_in' ? 'Check In' : 'Check Out'}</td>
                <td className="px-4 py-3 text-ink-soft">{r.session_type === 'activity' ? r.activity_name ?? 'Activity' : 'Daily'}</td>
                <td className="px-4 py-3 text-ink-soft">{r.source === 'kiosk' ? 'Kiosk' : r.source === 'parent_portal' ? 'Parent Portal' : 'Admin'}</td>
                <td className="px-4 py-3 text-ink-soft">{r.performed_by_label ?? '-'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">No attendance records in this range.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
