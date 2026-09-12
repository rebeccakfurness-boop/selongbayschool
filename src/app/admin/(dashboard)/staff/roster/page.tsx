import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getDutyRosterAll, getTeachingStaffWithoutNonContactTime } from '@/lib/duty-roster';
import StaffTabs from '@/components/admin/StaffTabs';
import DutyRosterManager, { type StaffOption } from '@/components/admin/DutyRosterManager';

export const dynamic = 'force-dynamic';

export default async function DutyRosterPage() {
  await requireAdmin();
  await ensureSchema();

  const entries = await getDutyRosterAll();
  const staffOptions = (await sql`
    SELECT id, COALESCE(display_name, email) AS label
    FROM admin_users
    WHERE employment_status IN ('teaching_staff', 'admin_staff', 'casual_employee')
    ORDER BY label
  `) as unknown as StaffOption[];
  const missingNonContact = await getTeachingStaffWithoutNonContactTime();

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Duty Roster</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            Assign each staff member&apos;s daily duties — Welcome to School, break and lunch duty, CCA
            supervision, non-contact/admin time, and online teaching duty. This feeds directly into
            each staff member&apos;s own &quot;My Roster&quot; view.
          </p>
        </div>
        <StaffTabs active="roster" />
      </div>
      <div className="mt-6">
        <DutyRosterManager initial={entries} staffOptions={staffOptions} missingNonContact={missingNonContact} />
      </div>
    </section>
  );
}
