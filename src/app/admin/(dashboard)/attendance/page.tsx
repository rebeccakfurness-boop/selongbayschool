import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getTodayRosterSummary, schoolLocalToday } from '@/lib/attendance';
import GuardianRequestsList, { type GuardianRequestRow } from '@/components/admin/GuardianRequestsList';
import TodayRosterTable from '@/components/admin/TodayRosterTable';

export const dynamic = 'force-dynamic';

export default async function AdminAttendancePage() {
  await requireAdmin();
  await ensureSchema();

  const [roster, pendingRequests] = await Promise.all([
    getTodayRosterSummary(),
    sql`
      SELECT gc.customer_id, gc.child_id, c.child_full_name, cu.name AS guardian_name, cu.email AS guardian_email,
        gc.relationship, gc.requested_at::text
      FROM guardian_children gc
      JOIN children c ON c.id = gc.child_id
      JOIN customers cu ON cu.id = gc.customer_id
      WHERE gc.status = 'pending'
      ORDER BY gc.requested_at ASC
    ` as unknown as Promise<GuardianRequestRow[]>,
  ]);

  const checkedIn = roster.filter((r) => r.status === 'checked_in').length;
  const checkedOut = roster.filter((r) => r.status === 'checked_out').length;
  const notArrived = roster.filter((r) => r.status === 'not_arrived').length;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Attendance</h1>
          <p className="mt-1 text-sm text-ink-soft">Today, {schoolLocalToday()}: gate check-in status and requests.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/kiosk" className="rounded-full border border-teal px-5 py-2 text-sm font-bold text-teal-deep hover:bg-teal/10">
            Open Gate Kiosk
          </Link>
          <Link href="/admin/attendance/report" className="rounded-full bg-teal px-5 py-2 text-sm font-bold text-white hover:bg-teal-deep">
            Reports &amp; export
          </Link>
        </div>
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold text-ink">Today&apos;s Roster</h2>
          <div className="mt-3 max-h-[420px] overflow-y-auto">
            <TodayRosterTable roster={roster} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold text-ink">Pending Child Link Requests</h2>
            <p className="mt-1 text-xs text-ink-soft">Self-service requests from /account/link-child; approve to let a parent see and check in/out that child.</p>
            <div className="mt-3">
              <GuardianRequestsList initial={pendingRequests} />
            </div>
          </div>

          <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold text-ink">Gate Kiosk</h2>
            <p className="mt-1 text-xs text-ink-soft">
              No separate PIN anymore: log into <span className="font-mono">/kiosk</span> on the gate device with a
              staff account (any admin or teacher) and leave it signed in for the day. From there, a parent can sign
              their own child in/out, or staff can check a child in/out directly without a signature.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
