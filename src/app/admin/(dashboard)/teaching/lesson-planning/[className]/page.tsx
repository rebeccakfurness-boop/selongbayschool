import Link from 'next/link';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { getCurriculumTermsForClasses } from '@/lib/curriculum';
import { PRIMARY_SUBJECTS, isPrimaryYearLevel } from '@/lib/curriculum-year-levels';
import TeachingTabs from '@/components/admin/TeachingTabs';

export const dynamic = 'force-dynamic';

export default async function LessonPlanningYearLevelPage({ params }: { params: Promise<{ className: string }> }) {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const { className: classNameParam } = await params;
  const className = decodeURIComponent(classNameParam);

  if (!(await canAccessClass(staff, className))) {
    return (
      <section>
        <h1 className="font-display text-2xl font-semibold text-ink">Not available</h1>
        <p className="mt-2 text-sm text-ink-soft">You are not assigned to {className}.</p>
        <Link href="/admin/teaching/lesson-planning" className="mt-4 inline-block text-sm font-semibold text-teal-deep underline">
          ← Back to Lesson Planning &amp; Preparation
        </Link>
      </section>
    );
  }

  const terms = await getCurriculumTermsForClasses([className]);
  const termsBySubject = new Map<string, typeof terms>();
  for (const t of terms) {
    if (!termsBySubject.has(t.subject)) termsBySubject.set(t.subject, []);
    termsBySubject.get(t.subject)!.push(t);
  }

  const isPrimary = isPrimaryYearLevel(className);
  const subjectsToShow = isPrimary ? [...new Set([...PRIMARY_SUBJECTS, ...termsBySubject.keys()])] : [...termsBySubject.keys()].sort();

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
            <Link href="/admin/teaching/lesson-planning" className="hover:underline">
              Lesson Planning &amp; Preparation
            </Link>{' '}
            / {className}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{className}</h1>
        </div>
        <TeachingTabs active="lessonPlanning" />
      </div>

      {subjectsToShow.length === 0 ? (
        <div className="mt-8 rounded-md border border-sand-line bg-paper p-6 shadow-soft">
          <p className="text-sm text-ink-soft">No programmes yet for {className}.</p>
          <Link href="/admin/teaching/curriculum-plans" className="mt-2 inline-block text-sm font-semibold text-teal-deep underline">
            Go to Curriculum Plans to create or import one →
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjectsToShow.map((subject) => {
            const subjectTerms = termsBySubject.get(subject) ?? [];
            const href =
              subjectTerms.length === 1
                ? `/admin/teaching/curriculum-plans/${subjectTerms[0].id}`
                : `/admin/teaching/lesson-planning/${encodeURIComponent(className)}/${encodeURIComponent(subject)}`;
            const hasContent = subjectTerms.length > 0;
            return (
              <Link
                key={subject}
                href={href}
                className={`rounded-md border p-6 shadow-soft transition-colors ${
                  hasContent ? 'border-sand-line bg-paper hover:border-teal' : 'border-dashed border-sand-line bg-paper/60 hover:border-teal'
                }`}
              >
                <h2 className="font-display text-lg font-semibold text-teal-deep">{subject}</h2>
                <p className="mt-2 text-sm text-ink-soft">
                  {subjectTerms.length === 0
                    ? 'Not started yet'
                    : subjectTerms.length === 1
                      ? subjectTerms[0].term_label
                      : `${subjectTerms.length} programmes`}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
