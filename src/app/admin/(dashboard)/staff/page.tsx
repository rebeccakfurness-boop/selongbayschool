import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { WEEKLY_SCHEDULE_CLASSES } from '@/lib/class-schedule';
import StaffManager, { type StaffRow } from '@/components/admin/StaffManager';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  await requireAdmin();
  await ensureSchema();

  const staff = (await sql`
    SELECT
      au.id, au.email, au.display_name, au.role, au.is_active,
      COALESCE(
        array_agg(ta.class_name) FILTER (WHERE ta.class_name IS NOT NULL),
        ARRAY[]::text[]
      ) AS assigned_classes
    FROM admin_users au
    LEFT JOIN teacher_assignments ta ON ta.admin_user_id = au.id
    GROUP BY au.id
    ORDER BY au.is_active DESC, au.role, au.email
  `) as unknown as StaffRow[];

  // The 10 live classes are always assignable, even before any child is actually enrolled under
  // that exact name -- a class should be staffable ahead of having students in it. Real
  // class_name variants already on children (the school's messy historical naming) are still
  // offered too, so an existing assignment under one of those isn't suddenly impossible to redo.
  const childClassNames = ((await sql`
    SELECT DISTINCT class_name FROM children WHERE class_name IS NOT NULL ORDER BY class_name
  `) as unknown as { class_name: string }[]).map((r) => r.class_name);
  const classOptions = [...new Set([...WEEKLY_SCHEDULE_CLASSES, ...childClassNames])].sort();

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Staff</h1>
      <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
        Create admin/teacher accounts and assign teachers to the classes they should see on the Family Board,
        Calendar, and Teaching pages.
      </p>
      <div className="mt-6">
        <StaffManager initial={staff} classOptions={classOptions} />
      </div>
    </section>
  );
}
