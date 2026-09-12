import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { getLessonWorksheetsForReview } from '@/lib/online-learning';
import { formatDateTime } from '@/lib/admin-format';
import OnlineLearningSubNav from '@/components/admin/OnlineLearningSubNav';
import GradeSubmissionForm from '@/components/admin/GradeSubmissionForm';

export const dynamic = 'force-dynamic';

export default async function AdminOnlineLearningWorksheetsPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const all = await getLessonWorksheetsForReview();
  const submissions = [];
  for (const s of all) {
    if (await canAccessClass(staff, s.class_name)) submissions.push(s);
  }
  const ungradedCount = submissions.filter((s) => !s.graded_at).length;

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Worksheets to Mark</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {submissions.length} total · {ungradedCount} not yet marked. Uploaded from the self-directed online lesson flow.
      </p>
      <OnlineLearningSubNav active="/admin/online-learning/worksheets" />

      <div className="mt-4 flex flex-col gap-3">
        {submissions.map((s) => (
          <div key={s.id} className="rounded-md border border-sand-line bg-paper p-4 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-ink-soft">{s.class_name} · {s.subject} · {s.lesson_title}</p>
                <p className="mt-1 font-semibold text-ink">{s.child_full_name}</p>
                <p className="mt-1 text-sm text-ink-soft">Submitted {formatDateTime(s.submitted_at)}</p>
              </div>
              {s.graded_at && <span className="whitespace-nowrap rounded-full bg-teal/15 px-2 py-0.5 text-xs font-bold text-teal-deep">Graded</span>}
            </div>

            <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-bold text-teal-deep underline">
              View submitted worksheet →
            </a>

            <div className="mt-3">
              <GradeSubmissionForm
                gradeEndpoint={`/api/admin/online-learning/worksheets/${s.id}/grade`}
                initialGrade={s.grade}
                initialComment={s.comments}
                commentField="comments"
              />
            </div>
          </div>
        ))}
        {submissions.length === 0 && (
          <p className="rounded-md border border-sand-line bg-paper p-6 text-center text-sm text-ink-soft">Nothing to mark yet.</p>
        )}
      </div>
    </section>
  );
}
