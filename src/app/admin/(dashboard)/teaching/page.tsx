import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, getAssignedClasses } from '@/lib/current-staff';
import TeachingTabs from '@/components/admin/TeachingTabs';
import LessonPlansManager, { type LessonPlan } from '@/components/admin/LessonPlansManager';

export const dynamic = 'force-dynamic';

export default async function LessonPlansPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();

  const classOptions =
    staff.role === 'teacher'
      ? await getAssignedClasses(staff.adminUserId)
      : ((await sql`SELECT DISTINCT class_name FROM children WHERE class_name IS NOT NULL ORDER BY class_name`) as unknown as { class_name: string }[]).map((r) => r.class_name);

  const plans = (
    staff.role === 'teacher'
      ? await sql`SELECT id, class_name, week_label, subject, title, description, created_at FROM lesson_plans WHERE class_name = ANY(${classOptions}) ORDER BY created_at DESC`
      : await sql`SELECT id, class_name, week_label, subject, title, description, created_at FROM lesson_plans ORDER BY created_at DESC`
  ) as unknown as LessonPlan[];

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Teaching</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            Lesson plans feed the &quot;upcoming lessons&quot; view in the parent and student portals.
          </p>
        </div>
        <TeachingTabs active="lessons" />
      </div>
      <div className="mt-6">
        <LessonPlansManager initial={plans} classOptions={classOptions} />
      </div>
    </section>
  );
}
