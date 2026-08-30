import Link from 'next/link';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { getCurriculumTermsForClasses } from '@/lib/curriculum';

export const dynamic = 'force-dynamic';

/** Reached only when a (year level, subject) pair has more than one programme -- the subject
 * grid one level up links straight to /admin/teaching/curriculum-plans/[termId] when there's
 * exactly one, so a teacher with a single programme per subject never sees this extra step. */
export default async function LessonPlanningTermPickerPage({ params }: { params: Promise<{ className: string; subject: string }> }) {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const { className: classNameParam, subject: subjectParam } = await params;
  const className = decodeURIComponent(classNameParam);
  const subject = decodeURIComponent(subjectParam);

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

  const terms = (await getCurriculumTermsForClasses([className])).filter((t) => t.subject === subject);

  return (
    <section>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
          <Link href="/admin/teaching/lesson-planning" className="hover:underline">
            Lesson Planning &amp; Preparation
          </Link>{' '}
          /{' '}
          <Link href={`/admin/teaching/lesson-planning/${encodeURIComponent(className)}`} className="hover:underline">
            {className}
          </Link>{' '}
          / {subject}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
          {className} · {subject}
        </h1>
      </div>

      {terms.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">No programmes found for {className} / {subject}.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-2">
          {terms.map((t) => (
            <Link
              key={t.id}
              href={`/admin/teaching/curriculum-plans/${t.id}`}
              className="rounded-md border border-sand-line bg-paper p-5 shadow-soft transition-colors hover:border-teal"
            >
              <p className="font-display text-base font-semibold text-teal-deep">{t.term_label}</p>
              {t.framework_label && <p className="mt-1 text-xs text-ink-soft">{t.framework_label}</p>}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
