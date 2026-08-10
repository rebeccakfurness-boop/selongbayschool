import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, getAssignedClasses } from '@/lib/current-staff';
import { getCurriculumTermsForClasses } from '@/lib/curriculum';
import TeachingTabs from '@/components/admin/TeachingTabs';
import CurriculumPlanManager, { type ClassRoster } from '@/components/admin/CurriculumPlanManager';

export const dynamic = 'force-dynamic';

export default async function CurriculumPlansPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();

  const classOptions =
    staff.role === 'teacher'
      ? await getAssignedClasses(staff.adminUserId)
      : ((await sql`SELECT DISTINCT class_name FROM children WHERE class_name IS NOT NULL ORDER BY class_name`) as unknown as { class_name: string }[]).map((r) => r.class_name);

  const terms = await getCurriculumTermsForClasses(classOptions);

  const childRows =
    classOptions.length === 0
      ? []
      : ((await sql`
          SELECT id, class_name, COALESCE(child_nickname, child_full_name) AS label FROM children
          WHERE class_name = ANY(${classOptions}) ORDER BY child_full_name
        `) as unknown as { id: number; class_name: string; label: string }[]);
  const childrenByClass: Record<string, ClassRoster> = {};
  for (const row of childRows) {
    (childrenByClass[row.class_name] ??= []).push({ id: row.id, label: row.label });
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Teaching</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            A full term of units and lessons per class and subject — like Oak National Academy. Each lesson can
            carry a downloadable worksheet, extra resources, and every student&apos;s progress through it.
          </p>
        </div>
        <TeachingTabs active="curriculumPlans" />
      </div>
      <div className="mt-6">
        <CurriculumPlanManager initialTerms={terms} classOptions={classOptions} childrenByClass={childrenByClass} />
      </div>
    </section>
  );
}
