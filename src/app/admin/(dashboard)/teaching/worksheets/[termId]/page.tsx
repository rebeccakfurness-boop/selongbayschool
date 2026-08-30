import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { getCurriculumTermTree, flattenLessons } from '@/lib/curriculum';
import { formatDate } from '@/lib/admin-format';
import PrintButton from '@/components/PrintButton';
import { WORKSHEET_CSS } from '@/lib/worksheet-css';

export const dynamic = 'force-dynamic';

/** Every real worksheet in one term, one after another, each starting on its own page -- for a
 * teacher who wants the whole term's worksheets as one PDF/print run instead of opening each
 * lesson's worksheet one at a time. Same print approach as the single-lesson worksheet route
 * (src/app/admin/(dashboard)/teaching/worksheet/[lessonId]): a real page, never an iframe, with
 * its own @media print rules -- see that route and worksheet-css.ts for why. */
export default async function WorksheetBundlePage({ params }: { params: Promise<{ termId: string }> }) {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const { termId: termIdParam } = await params;
  const termId = Number(termIdParam);

  if (!Number.isInteger(termId)) return <NotFound />;
  const term = await getCurriculumTermTree(termId, true);
  if (!term) return <NotFound />;
  if (!(await canAccessClass(staff, term.class_name))) {
    return (
      <section className="p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Not available</h1>
        <p className="mt-2 text-sm text-ink-soft">You are not assigned to {term.class_name}.</p>
      </section>
    );
  }

  const lessons = flattenLessons(term).filter((l) => l.real_worksheet);

  if (lessons.length === 0) {
    return (
      <section className="p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">No worksheets to print</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {term.class_name} / {term.subject} / {term.term_label} has no lessons with a printable worksheet yet.
        </p>
      </section>
    );
  }

  return (
    <div className="p-8 print:p-0">
      <style>{WORKSHEET_CSS}</style>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {term.class_name} · {term.subject} · {term.term_label}
          </p>
          <h1 className="font-display text-xl font-semibold text-ink">
            {lessons.length} worksheet{lessons.length === 1 ? '' : 's'}
          </h1>
        </div>
        <PrintButton label={`Print all ${lessons.length} worksheets`} />
      </div>

      {lessons.map((lesson, i) => (
        <div key={lesson.id} className="ws" style={{ breakBefore: i === 0 ? 'auto' : 'page', pageBreakBefore: i === 0 ? 'auto' : 'always' }}>
          <div className="ws-head">
            <div>
              <p className="ws-meta">
                {term.class_name} · {term.subject} · {term.term_label}
              </p>
              <h1>{lesson.title}</h1>
            </div>
            <p className="ws-meta">
              {lesson.lesson_date ? formatDate(lesson.lesson_date) : ''}
              {lesson.syllabus_ref ? ` · ${lesson.syllabus_ref}` : ''}
            </p>
          </div>
          <div className="ws-name">
            <span>Name</span>
            <span>Date</span>
          </div>
          {lesson.real_worksheet!.tasks.map((task, j) => (
            <div key={j} className="ws-task">
              <h2>{task.heading}</h2>
              {task.instruction && <p className="ws-inst">{task.instruction}</p>}
              {/* Trusted HTML fragment, see real_worksheet's column comment in db.ts */}
              <div dangerouslySetInnerHTML={{ __html: task.body }} />
            </div>
          ))}
          <div className="ws-foot">
            <span>{term.class_name} · {term.subject}</span>
            {lesson.real_worksheet!.objectives && <span>{lesson.real_worksheet!.objectives}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotFound() {
  return (
    <section className="p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Programme not found</h1>
    </section>
  );
}
