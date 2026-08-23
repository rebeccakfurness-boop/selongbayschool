import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { ensureSchema } from '@/lib/db';
import { getChildrenForGuardian } from '@/lib/lms-data';
import {
  getTodayDailyStatusForChildren,
  getActiveActivityOptions,
  getAttendanceHistoryForChild,
  findOpenDailyAttendanceDays,
  type AttendanceHistoryRow,
} from '@/lib/attendance';
import { formatDateTime } from '@/lib/admin-format';
import AccountNav from '@/components/account/AccountNav';
import ChildAvatar from '@/components/ChildAvatar';
import AttendanceActionButton from '@/components/account/AttendanceActionButton';
import ActivityCheckIn from '@/components/account/ActivityCheckIn';

export const dynamic = 'force-dynamic';

function OverviewLoadError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-ink">Attendance</h1>
      <div className="mt-6 rounded-md border border-orange-deep/40 bg-orange/10 p-5">
        <p className="font-semibold text-orange-deep">This page couldn&apos;t load.</p>
        <p className="mt-2 text-sm text-ink-soft">Please share this message with the school office so it can be fixed:</p>
        <pre className="mt-3 overflow-x-auto rounded-sm bg-ink/5 p-3 text-xs text-ink">{message}</pre>
      </div>
    </div>
  );
}

function eventLabel(row: AttendanceHistoryRow): string {
  const action = row.event_type === 'check_in' ? 'Checked in' : 'Checked out';
  if (row.session_type === 'activity') return `${action}: ${row.activity_name ?? 'Activity'}`;
  return action;
}

function sourceLabel(row: AttendanceHistoryRow): string {
  if (row.source === 'kiosk') return row.signed_by_name ? `Gate kiosk: signed by ${row.signed_by_name}` : 'Gate kiosk';
  if (row.source === 'parent_portal') return row.performed_by_label ? `Portal: ${row.performed_by_label}` : 'Parent portal';
  return row.performed_by_label ? `Admin override: ${row.performed_by_label}` : 'Admin override';
}

export default async function AccountAttendancePage() {
  try {
    const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
    const customerId = session.customerId;

    await ensureSchema();
    const children = customerId ? await getChildrenForGuardian(customerId) : [];
    const statusMap = await getTodayDailyStatusForChildren(children.map((c) => c.id));
    const activities = await getActiveActivityOptions();
    const historyByChild = new Map(
      await Promise.all(children.map(async (c) => [c.id, await getAttendanceHistoryForChild(c.id, 15)] as const))
    );

    return renderAttendancePage({ children, statusMap, activities, historyByChild });
  } catch (error) {
    console.error('[account/attendance] failed to load', error);
    return <OverviewLoadError error={error} />;
  }
}

function renderAttendancePage({
  children,
  statusMap,
  activities,
  historyByChild,
}: {
  children: Awaited<ReturnType<typeof getChildrenForGuardian>>;
  statusMap: Awaited<ReturnType<typeof getTodayDailyStatusForChildren>>;
  activities: Awaited<ReturnType<typeof getActiveActivityOptions>>;
  historyByChild: Map<number, AttendanceHistoryRow[]>;
}) {
  return (
    <div className="min-h-screen bg-cream">
      <AccountNav active="/account/attendance" />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Attendance</h1>
        <p className="mt-1 text-sm text-ink-soft">Check your children in or out, and see their recent attendance.</p>

        {children.length === 0 && (
          <div className="mt-8 rounded-md border border-dashed border-sand-line bg-paper p-8 text-center">
            <p className="text-ink-soft">
              No children are linked to your account yet. Ask the school office to link your email to your
              child&apos;s record.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-6">
          {children.map((child) => {
            const status = statusMap.get(child.id) ?? null;
            const history = historyByChild.get(child.id) ?? [];
            const openDays = findOpenDailyAttendanceDays(history);
            return (
              <div key={child.id} className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ChildAvatar photoUrl={child.photo_url} name={child.child_full_name} size="md" />
                    <div>
                      <p className="font-display text-lg font-semibold text-ink">{child.child_nickname || child.child_full_name}</p>
                      {child.class_name && <p className="text-xs text-ink-soft">{child.class_name}</p>}
                    </div>
                  </div>
                  {child.enrollment_type === 'regular' && (
                    <AttendanceActionButton
                      childId={child.id}
                      childName={child.child_nickname || child.child_full_name}
                      sessionType="daily"
                      currentEventType={status?.event_type ?? null}
                    />
                  )}
                </div>

                {openDays.length > 0 && (
                  <p className="mt-3 rounded-sm bg-orange/10 px-3 py-2 text-xs font-semibold text-orange-deep">
                    Checked in with no check-out recorded on {openDays.length} previous day{openDays.length === 1 ? '' : 's'}.
                  </p>
                )}

                <ActivityCheckIn childId={child.id} childName={child.child_nickname || child.child_full_name} activities={activities} />

                <div className="mt-4 border-t border-sand-line pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-ink-soft">Recent attendance</h3>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {history.map((row) => (
                      <li key={row.id} className="flex items-center justify-between text-sm">
                        <span className="text-ink">{eventLabel(row)}</span>
                        <span className="text-xs text-ink-soft">
                          {formatDateTime(row.occurred_at)} · {sourceLabel(row)}
                        </span>
                      </li>
                    ))}
                    {history.length === 0 && <li className="text-sm text-ink-soft">No attendance recorded yet.</li>}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
