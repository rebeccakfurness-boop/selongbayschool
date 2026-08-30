import Link from 'next/link';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, getAssignedClasses } from '@/lib/current-staff';
import { YEAR_LEVELS } from '@/lib/curriculum-year-levels';
import TeachingTabs from '@/components/admin/TeachingTabs';

export const dynamic = 'force-dynamic';

export default async function LessonPlanningPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const isAdmin = staff.role === 'admin';

  // Known year levels first, in YEAR_LEVELS' own Primary 1 -> Secondary 11 order (not whatever
  // order the DB returns a teacher's assignments in); any assigned class_name that doesn't
  // exactly match one of those (a typo, different spacing, a class not yet in the reference
  // list) still gets a tile -- appended afterwards -- rather than silently vanishing.
  let yearLevels: string[];
  if (isAdmin) {
    yearLevels = [...YEAR_LEVELS];
  } else {
    const assigned = await getAssignedClasses(staff.adminUserId);
    const known = YEAR_LEVELS.filter((yl) => assigned.includes(yl));
    const unknown = assigned.filter((c) => !(YEAR_LEVELS as readonly string[]).includes(c)).sort();
    yearLevels = [...known, ...unknown];
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Lesson Planning &amp; Preparation</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
            Every year level&apos;s teaching programmes in one place. Pick a year level, then a subject, to open its
            full lesson-planning dashboard: next lesson, pacing against the real timetable, and the syllabus map,
            exactly as built in Curriculum Plans.
          </p>
        </div>
        <TeachingTabs active="lessonPlanning" />
      </div>

      {yearLevels.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">
          {isAdmin ? 'No year levels found.' : "You're not assigned to any of the school's year levels yet."}
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {yearLevels.map((yl) => (
            <Link
              key={yl}
              href={`/admin/teaching/lesson-planning/${encodeURIComponent(yl)}`}
              className="rounded-md border border-sand-line bg-paper p-6 shadow-soft transition-colors hover:border-teal"
            >
              <h2 className="font-display text-lg font-semibold text-teal-deep">{yl}</h2>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
