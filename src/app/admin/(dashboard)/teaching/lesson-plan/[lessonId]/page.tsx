import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { getLessonPrintContext } from '@/lib/curriculum';
import { formatDate } from '@/lib/admin-format';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

export default async function LessonPlanPrintPage({ params }: { params: Promise<{ lessonId: string }> }) {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const { lessonId: lessonIdParam } = await params;
  const lessonId = Number(lessonIdParam);

  if (!Number.isInteger(lessonId)) return <NotFound />;
  const context = await getLessonPrintContext(lessonId);
  if (!context || !context.realPlan) return <NotFound />;
  if (!(await canAccessClass(staff, context.className))) {
    return (
      <section className="p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Not available</h1>
        <p className="mt-2 text-sm text-ink-soft">You are not assigned to {context.className}.</p>
      </section>
    );
  }

  const plan = context.realPlan;
  const stages: { label: string; timing: string | null; content: React.ReactNode }[] = [
    { label: 'Introduction', timing: plan.timings[0] ?? null, content: plan.intro },
    {
      label: 'Main activities',
      timing: plan.timings[1] ?? null,
      content: (
        <ul className="list-disc space-y-1.5 pl-5">
          {plan.main.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ul>
      ),
    },
    { label: 'Plenary', timing: plan.timings[2] ?? null, content: plan.plenary },
  ];

  return (
    <div className="mx-auto max-w-3xl p-8 print:p-0">
      <style>{'@page { size: A4; margin: 16mm; }'}</style>
      <div className="mb-6 flex items-center justify-end print:hidden">
        <PrintButton label="Print lesson plan" />
      </div>

      <div className="border-b-2 border-teal pb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {context.className} · {context.subject} · {context.termLabel}
        </p>
        <h1 className="font-display text-xl font-semibold text-ink">{context.title}</h1>
        <p className="mt-1 text-xs text-ink-soft">
          {context.lessonDate ? formatDate(context.lessonDate) : ''}
          {context.syllabusRef ? ` · ${context.syllabusRef}` : ''}
        </p>
      </div>

      {plan.objectives.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-soft">Objectives</h2>
          <ul className="mt-1.5 flex flex-col gap-1 text-sm">
            {plan.objectives.map((o) => (
              <li key={o.ref}>
                <span className="font-mono font-semibold text-teal-deep">{o.ref}</span>{' '}
                <span className="text-ink">{o.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.focus && (
        <p className="mt-4 text-sm">
          <span className="font-bold text-ink-soft">Focus: </span>
          {plan.focus}
        </p>
      )}
      <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
        {plan.prior && (
          <p>
            <span className="font-bold text-ink-soft">Prior: </span>
            {plan.prior}
          </p>
        )}
        {plan.next && (
          <p>
            <span className="font-bold text-ink-soft">Next: </span>
            {plan.next}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-4" style={{ breakInside: 'avoid' }}>
        {stages.map((stage) => (
          <div key={stage.label} className="rounded-md border border-sand-line p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-base font-semibold text-teal-deep">{stage.label}</h2>
              {stage.timing && <span className="text-xs font-semibold text-ink-soft">{stage.timing}</span>}
            </div>
            <div className="mt-1.5 text-sm text-ink">{stage.content}</div>
          </div>
        ))}
      </div>

      {plan.look_for && (
        <p className="mt-4 text-sm">
          <span className="font-bold text-ink-soft">Look for: </span>
          {plan.look_for}
        </p>
      )}
      {plan.resources.length > 0 && (
        <p className="mt-2 text-sm">
          <span className="font-bold text-ink-soft">Resources: </span>
          {plan.resources.join(', ')}
        </p>
      )}
      {plan.vocabulary && (
        <p className="mt-2 text-sm">
          <span className="font-bold text-ink-soft">Vocabulary: </span>
          {plan.vocabulary}
        </p>
      )}
      {plan.notes && (
        <p className="mt-2 text-sm">
          <span className="font-bold text-ink-soft">Notes: </span>
          {plan.notes}
        </p>
      )}
    </div>
  );
}

function NotFound() {
  return (
    <section className="p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Lesson plan not found</h1>
    </section>
  );
}
