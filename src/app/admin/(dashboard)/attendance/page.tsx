import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getTodayRosterSummary, schoolLocalToday } from '@/lib/attendance';
import { formatDateTime } from '@/lib/admin-format';
import KioskPinForm from '@/components/admin/KioskPinForm';
import GuardianRequestsList, { type GuardianRequestRow } from '@/components/admin/GuardianRequestsList';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  not_arrived: 'Not yet arrived',
  checked_in: 'Checked in',
  checked_out: 'Checked out',
};

const STATUS_CLASSES: Record<string, string> = {
  not_arrived: 'bg-sand/40 text-ink-soft',
  checked_in: 'bg-teal/15 text-teal-deep',
  checked_out: 'bg-orange/15 text-orange-deep',
};

export default async function AdminAttendancePage() {
  await requireAdmin();
  await ensureSchema();

  const [roster, pendingRequests, kioskSettings] = await Promise.all([
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
    sql`SELECT pin_hash IS NOT NULL AS configured FROM kiosk_settings WHERE id = 1` as unknown as Promise<{ configured: boolean }[]>,
  ]);

  const checkedIn = roster.filter((r) => r.status === 'checked_in').length;
  const checkedOut = roster.filter((r) => r.status === 'checked_out').length;
  const notArrived = roster.filter((r) => r.status === 'not_arrived').length;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Attendance</h1>
          <p className="mt-1 text-sm text-ink-soft">Today, {schoolLocalToday()} — gate check-in status and requests.</p>
        </div>
        <Link href="/admin/attendance/report" className="rounded-full bg-teal px-5 py-2 text-sm font-bold text-white hover:bg-teal-deep">
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold text-ink">Today&apos;s Roster</h2>
          <div className="mt-3 max-h-[420px] overflow-y-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-sand-line text-left">
                  <th className="py-2 font-bold text-ink-soft">Student</th>
                  <th className="py-2 font-bold text-ink-soft">Class</th>
                  <th className="py-2 font-bold text-ink-soft">Status</th>
                  <th className="py-2 font-bold text-ink-soft">Time</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => (
                  <tr key={r.childId} className="border-b border-sand-line/60 last:border-0">
                    <td className="py-2 font-semibold text-ink">{r.childFullName}</td>
                    <td className="py-2 text-ink-soft">{r.className ?? '-'}</td>
                    <td className="py-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASSES[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                    </td>
                    <td className="py-2 text-ink-soft">{r.lastEventTime ? formatDateTime(r.lastEventTime) : '-'}</td>
                  </tr>
                ))}
                {roster.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-ink-soft">No regular students on file.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold text-ink">Pending Child Link Requests</h2>
            <p className="mt-1 text-xs text-ink-soft">Self-service requests from /account/link-child — approve to let a parent see and check in/out that child.</p>
            <div className="mt-3">
              <GuardianRequestsList initial={pendingRequests} />
            </div>
          </div>

          <KioskPinForm configured={kioskSettings[0]?.configured ?? false} />
        </div>
      </div>
    </section>
  );
}
