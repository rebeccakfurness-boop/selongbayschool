import Link from 'next/link';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getTodayStaffRosterSummary } from '@/lib/staff-attendance';
import { schoolLocalToday } from '@/lib/attendance';
import StaffTabs from '@/components/admin/StaffTabs';
import TodayStaffRosterTable from '@/components/admin/TodayStaffRosterTable';

export const dynamic = 'force-dynamic';

export default async function StaffAttendancePage() {
  await requireAdmin();
  await ensureSchema();

  const roster = await getTodayStaffRosterSummary();
  const checkedIn = roster.filter((r) => r.status === 'checked_in').length;
  const checkedOut = roster.filter((r) => r.status === 'checked_out').length;
  const notArrived = roster.filter((r) => r.status === 'not_arrived').length;

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Staff Attendance</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">Today, {schoolLocalToday()}: staff check-in/out status.</p>
        </div>
        <StaffTabs active="attendance" />
      </div>

      <div className="mt-6 flex justify-end">
        <Link href="/admin/staff/attendance/report" className="rounded-full bg-teal px-5 py-2 text-sm font-bold text-white hover:bg-teal-deep">
          Reports &amp; export
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-sand-line bg-paper p-5 text-center shadow-soft">
          <p className="font-display text-3xl font-bold text-teal-deep">{checkedIn}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Checked in</p>
        </div>
        <div className="rounded-md border border-sand-line bg-paper p-5 text-center shadow-soft">
          <p className="font-display text-3xl font-bold text-orange-deep">{checkedOut}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Checked out</p>
        </div>
        <div className="rounded-md border border-sand-line bg-paper p-5 text-center shadow-soft">
          <p className="font-display text-3xl font-bold text-ink-soft">{notArrived}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Not yet arrived</p>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Today&apos;s Roster</h2>
        <div className="mt-3 max-h-[480px] overflow-y-auto">
          <TodayStaffRosterTable roster={roster} />
        </div>
      </div>
    </section>
  );
}
