import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import FamiliesTabs from '@/components/admin/FamiliesTabs';
import FamilyCalendar, { type CalendarChild } from '@/components/admin/FamilyCalendar';

export const dynamic = 'force-dynamic';

export default async function FamilyCalendarPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();

  let assignedClasses: string[] = [];
  if (staff.role === 'teacher') {
    const rows = (await sql`
      SELECT class_name FROM teacher_assignments WHERE admin_user_id = ${staff.adminUserId}
    `) as unknown as { class_name: string }[];
    assignedClasses = rows.map((r) => r.class_name);
  }

  const children = (await sql`
    SELECT id, child_full_name, child_nickname, class_name, enrolment_date, exit_date
    FROM children
    WHERE is_active = true AND (${staff.role === 'admin'} OR class_name = ANY(${assignedClasses}))
    ORDER BY child_full_name
  `) as unknown as CalendarChild[];

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Family Calendar</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            Who&apos;s on site on any given day, based on each child&apos;s enrolment and exit dates. A child with no
            enrolment date on file is shown as on-site every day until that gets filled in.
          </p>
        </div>
        <FamiliesTabs active="calendar" role={staff.role} />
      </div>

      <div className="mt-6">
        <FamilyCalendar roster={children} />
      </div>
    </section>
  );
}
