import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { getLessonPrintContext } from '@/lib/curriculum';
import { formatDate } from '@/lib/admin-format';
import PrintButton from '@/components/PrintButton';
import { WORKSHEET_CSS } from '@/lib/worksheet-css';

export const dynamic = 'force-dynamic';

export default async function WorksheetPrintPage({ params }: { params: Promise<{ lessonId: string }> }) {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const { lessonId: lessonIdParam } = await params;
  const lessonId = Number(lessonIdParam);

  if (!Number.isInteger(lessonId)) return <NotFound />;
  const context = await getLessonPrintContext(lessonId);
  if (!context || !context.realWorksheet) return <NotFound />;
  if (!(await canAccessClass(staff, context.className))) {
    return (
      <section className="p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Not available</h1>
        <p className="mt-2 text-sm text-ink-soft">You are not assigned to {context.className}.</p>
      </section>
    );
  }

  const worksheet = context.realWorksheet;

  return (
    <div className="p-8 print:p-0">
      <style>{WORKSHEET_CSS}</style>
      <div className="mb-6 flex items-center justify-end print:hidden">
        <PrintButton label="Print worksheet" />
      </div>
      <div className="ws">
        <div className="ws-head">
          <div>
            <p className="ws-meta">
              {context.className} · {context.subject} · {context.termLabel}
            </p>
            <h1>{context.title}</h1>
          </div>
          <p className="ws-meta">
            {context.lessonDate ? formatDate(context.lessonDate) : ''}
            {context.syllabusRef ? ` · ${context.syllabusRef}` : ''}
          </p>
        </div>
        <div className="ws-name">
          <span>Name</span>
          <span>Date</span>
        </div>
        {worksheet.tasks.map((task, i) => (
          <div key={i} className="ws-task">
            <h2>{task.heading}</h2>
            {task.instruction && <p className="ws-inst">{task.instruction}</p>}
            {/* Trusted HTML fragment, see real_worksheet's column comment in db.ts */}
            <div dangerouslySetInnerHTML={{ __html: task.body }} />
          </div>
        ))}
        <div className="ws-foot">
          <span>{context.className} · {context.subject}</span>
          {worksheet.objectives && <span>{worksheet.objectives}</span>}
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <section className="p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Worksheet not found</h1>
    </section>
  );
}
