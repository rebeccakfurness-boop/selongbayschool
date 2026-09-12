import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { getAnswersForReview } from '@/lib/online-learning';
import { formatDateTime } from '@/lib/admin-format';
import OnlineLearningSubNav from '@/components/admin/OnlineLearningSubNav';
import GradeSubmissionForm from '@/components/admin/GradeSubmissionForm';

export const dynamic = 'force-dynamic';

export default async function AdminOnlineLearningAnswersPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const all = await getAnswersForReview();
  const answers = [];
  for (const a of all) {
    if (await canAccessClass(staff, a.class_name)) answers.push(a);
  }
  const ungradedCount = answers.filter((a) => !a.graded_at).length;

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Answers to Review</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {answers.length} total · {ungradedCount} not yet graded. Typed or voice answers to open-response questions in the
        self-directed online lessons.
      </p>
      <OnlineLearningSubNav active="/admin/online-learning/answers" />

      <div className="mt-4 flex flex-col gap-3">
        {answers.map((a) => (
          <div key={a.id} className="rounded-md border border-sand-line bg-paper p-4 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-ink-soft">
                  {a.class_name} · {a.subject} · {a.lesson_title} · {a.quiz_type === 'starter' ? 'Starter quiz' : 'Exit quiz'}
                </p>
                <p className="mt-1 font-semibold text-ink">{a.question}</p>
                <p className="mt-1 text-sm text-ink-soft">{a.child_full_name} · submitted {formatDateTime(a.submitted_at)}</p>
              </div>
              {a.graded_at && <span className="whitespace-nowrap rounded-full bg-teal/15 px-2 py-0.5 text-xs font-bold text-teal-deep">Graded</span>}
            </div>

            {a.answer_text && <p className="mt-3 whitespace-pre-line rounded-sm bg-sand/30 p-3 text-sm text-ink">{a.answer_text}</p>}
            {a.answer_audio_url && (
              <audio controls src={a.answer_audio_url} className="mt-3 w-full max-w-sm" />
            )}

            <div className="mt-3">
              <GradeSubmissionForm
                gradeEndpoint={`/api/admin/online-learning/answers/${a.id}/grade`}
                initialGrade={a.grade}
                initialComment={a.teacher_comment}
                commentField="comment"
              />
            </div>
          </div>
        ))}
        {answers.length === 0 && <p className="rounded-md border border-sand-line bg-paper p-6 text-center text-sm text-ink-soft">Nothing to review yet.</p>}
      </div>
    </section>
  );
}
