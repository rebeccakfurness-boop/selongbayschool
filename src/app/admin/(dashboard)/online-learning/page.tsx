import Link from 'next/link';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { getOnlineLearningOverview } from '@/lib/online-learning';
import OnlineLearningSubNav from '@/components/admin/OnlineLearningSubNav';

export const dynamic = 'force-dynamic';

export default async function AdminOnlineLearningPage() {
  await ensureSchema();
  await getCurrentStaff();
  const rows = await getOnlineLearningOverview();
  const totalAnswers = rows.reduce((s, r) => s + r.answers_awaiting_review, 0);
  const totalWorksheets = rows.reduce((s, r) => s + r.worksheets_awaiting_review, 0);

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Online Learning</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Self-directed lessons students work through on their own — introduction, worksheet, starter quiz, video, questions and
        exit quiz — aligned to the same Cambridge-linked curriculum used in Teaching. Manage lesson content itself from{' '}
        <Link href="/admin/teaching/curriculum-plans" className="font-semibold text-teal-deep hover:underline">
          Curriculum Plans
        </Link>
        .
      </p>
      <OnlineLearningSubNav active="/admin/online-learning" />

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/admin/online-learning/answers"
          className="rounded-md border border-sand-line bg-paper px-5 py-4 shadow-soft hover:border-teal"
        >
          <p className="text-2xl font-bold text-ink">{totalAnswers}</p>
          <p className="text-sm text-ink-soft">Typed/voice answers awaiting review</p>
        </Link>
        <Link
          href="/admin/online-learning/worksheets"
          className="rounded-md border border-sand-line bg-paper px-5 py-4 shadow-soft hover:border-teal"
        >
          <p className="text-2xl font-bold text-ink">{totalWorksheets}</p>
          <p className="text-sm text-ink-soft">Worksheets awaiting marking</p>
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-sand-line bg-paper">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              <th className="px-4 py-3 font-bold text-ink-soft">Class</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Subject</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Published lessons</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Completed by at least one student</th>
              <th className="px-4 py-3 font-bold text-ink-soft">Awaiting review</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.class_name}-${r.subject}`} className="border-b border-sand-line/60 last:border-0">
                <td className="px-4 py-3 font-semibold text-ink">{r.class_name}</td>
                <td className="px-4 py-3 text-ink-soft">{r.subject}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{r.lessons_published}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{r.lessons_completed_by_at_least_one}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                  {r.answers_awaiting_review + r.worksheets_awaiting_review > 0 ? (
                    <span className="rounded-full bg-orange/20 px-2 py-0.5 text-xs font-bold text-orange-deep">
                      {r.answers_awaiting_review + r.worksheets_awaiting_review}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-soft">
                  No published online lessons yet — publish one from Teaching → Curriculum Plans.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
