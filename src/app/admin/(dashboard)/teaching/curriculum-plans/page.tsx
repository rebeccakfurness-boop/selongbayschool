import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, getAssignedClasses } from '@/lib/current-staff';
import { getCurriculumTermsForClasses, getAllCurriculumTerms } from '@/lib/curriculum';
import TeachingTabs from '@/components/admin/TeachingTabs';
import CurriculumPlanManager, { type ClassRoster } from '@/components/admin/CurriculumPlanManager';
import ImportSampleCurriculumButton from '@/components/admin/ImportSampleCurriculumButton';
import ImportCurriculumQuizContentButton from '@/components/admin/ImportCurriculumQuizContentButton';

export const dynamic = 'force-dynamic';

export default async function CurriculumPlansPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const isAdmin = staff.role === 'admin';

  const classOptions =
    staff.role === 'teacher'
      ? await getAssignedClasses(staff.adminUserId)
      : ((await sql`SELECT DISTINCT class_name FROM children WHERE class_name IS NOT NULL ORDER BY class_name`) as unknown as { class_name: string }[]).map((r) => r.class_name);

  // Admins see every programme regardless of class_name match (see getAllCurriculumTerms) so a
  // mismatched or imported-but-unlinked programme is always findable and fixable here; teachers
  // stay scoped to their assigned classes.
  const terms = isAdmin ? await getAllCurriculumTerms() : await getCurriculumTermsForClasses(classOptions);
  const unmatchedTerms = isAdmin ? terms.filter((t) => !classOptions.includes(t.class_name)) : [];

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
            carry a downloadable worksheet, extra resources, a video, and a self-directed &quot;Complete online&quot;
            flow (Introduction → Starter quiz → Video → Exit quiz) that a parent or student can work through
            themselves, alongside every student&apos;s progress through it.
          </p>
        </div>
        <TeachingTabs active="curriculumPlans" />
      </div>
      {isAdmin && (
        <div className="mt-6 flex flex-col gap-4">
          <ImportSampleCurriculumButton />
          <ImportCurriculumQuizContentButton />
        </div>
      )}
      {isAdmin && unmatchedTerms.length > 0 && (
        <div className="mt-6 rounded-md border border-orange/40 bg-orange/10 p-4">
          <p className="text-sm font-semibold text-orange-deep">
            {unmatchedTerms.length} programme{unmatchedTerms.length === 1 ? '' : 's'} won&apos;t show up for any teacher yet
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Their class doesn&apos;t match any class name currently used on a Child Card, so no teacher is scoped
            to see them. Open one below and edit its class to match — current class names in use:{' '}
            {classOptions.length > 0 ? classOptions.join(', ') : 'none yet'}.
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {unmatchedTerms.map((t) => (
              <li key={t.id} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-deep">
                {t.class_name} · {t.subject} · {t.term_label}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-6">
        <CurriculumPlanManager initialTerms={terms} classOptions={classOptions} childrenByClass={childrenByClass} isAdmin={isAdmin} />
      </div>
    </section>
  );
}
