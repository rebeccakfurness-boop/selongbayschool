import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, getAssignedClasses } from '@/lib/current-staff';
import TeachingTabs from '@/components/admin/TeachingTabs';
import CurriculumUnitsManager, { type CurriculumUnit } from '@/components/admin/CurriculumUnitsManager';

export const dynamic = 'force-dynamic';

export default async function CurriculumUnitsPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();

  const classOptions =
    staff.role === 'teacher'
      ? await getAssignedClasses(staff.adminUserId)
      : ((await sql`SELECT DISTINCT class_name FROM children WHERE class_name IS NOT NULL ORDER BY class_name`) as unknown as { class_name: string }[]).map((r) => r.class_name);

  const units = (
    staff.role === 'teacher'
      ? await sql`SELECT id, class_name, term_label, unit_title, description, is_current, created_at FROM curriculum_units WHERE class_name = ANY(${classOptions}) ORDER BY created_at DESC`
      : await sql`SELECT id, class_name, term_label, unit_title, description, is_current, created_at FROM curriculum_units ORDER BY created_at DESC`
  ) as unknown as CurriculumUnit[];

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Teaching</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            The current curriculum unit per class shows on the parent portal, especially useful for hybrid and
            worldschooling families.
          </p>
        </div>
        <TeachingTabs active="curriculum" />
      </div>
      <div className="mt-6">
        <CurriculumUnitsManager initial={units} classOptions={classOptions} />
      </div>
    </section>
  );
}
