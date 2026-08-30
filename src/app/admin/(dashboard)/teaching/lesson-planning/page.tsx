import Link from 'next/link';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, getAssignedClasses } from '@/lib/current-staff';
import { getAllCurriculumTerms, getCurriculumTermsForClasses } from '@/lib/curriculum';
import { YEAR_LEVELS } from '@/lib/curriculum-year-levels';

export const dynamic = 'force-dynamic';

export default async function LessonPlanningPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const isAdmin = staff.role === 'admin';

  const yearLevels = isAdmin
    ? [...YEAR_LEVELS]
    : (await getAssignedClasses(staff.adminUserId)).filter((c) => (YEAR_LEVELS as readonly string[]).includes(c));

  const terms = isAdmin ? await getAllCurriculumTerms() : await getCurriculumTermsForClasses(yearLevels);
  const subjectsByYearLevel = new Map<string, Set<string>>();
  for (const t of terms) {
    if (!subjectsByYearLevel.has(t.class_name)) subjectsByYearLevel.set(t.class_name, new Set());
    subjectsByYearLevel.get(t.class_name)!.add(t.subject);
  }

  return (
    <section>
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Lesson Planning &amp; Preparation</h1>
        <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
          Every year level&apos;s teaching programmes in one place. Pick a year level, then a subject, to open its
          full lesson-planning dashboard — next lesson, pacing against the real timetable, and the syllabus
          map, exactly as built in Curriculum Plans.
        </p>
      </div>

      {yearLevels.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">
          {isAdmin ? 'No year levels found.' : "You're not assigned to any of the school's year levels yet."}
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {yearLevels.map((yl) => {
            const subjectCount = subjectsByYearLevel.get(yl)?.size ?? 0;
            return (
              <Link
                key={yl}
                href={`/admin/teaching/lesson-planning/${encodeURIComponent(yl)}`}
                className="rounded-md border border-sand-line bg-paper p-6 shadow-soft transition-colors hover:border-teal"
              >
                <h2 className="font-display text-lg font-semibold text-teal-deep">{yl}</h2>
                <p className="mt-2 text-sm text-ink-soft">
                  {subjectCount === 0 ? 'No programmes yet' : `${subjectCount} subject${subjectCount === 1 ? '' : 's'} with a programme`}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
