import Link from 'next/link';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getStudentSessionOptions, type StudentSessionData } from '@/lib/auth';
import { getChildOnlineProgrammeTerms, getChildOnlineScheduleWithNextLessons } from '@/lib/online-learning';
import StudentNav from '@/components/student/StudentNav';
import OnlineLearningScheduleBoard from '@/components/curriculum/OnlineLearningScheduleBoard';

export const dynamic = 'force-dynamic';

export default async function StudentOnlineLearningPage() {
  await ensureSchema();
  const session = await getIronSession<StudentSessionData>(await cookies(), await getStudentSessionOptions());

  const [child] = (await sql`
    SELECT child_full_name, child_nickname, class_name, online_learning_enabled FROM children WHERE id = ${session.childId}
  `) as unknown as {
    child_full_name: string;
    child_nickname: string | null;
    class_name: string | null;
    online_learning_enabled: boolean;
  }[];

  if (!session.childId || !child?.online_learning_enabled) {
    return (
      <div className="flex min-h-screen flex-col bg-cream px-6 py-12">
        <div className="mx-auto w-full max-w-2xl">
          <StudentNav active="/student/online-learning" />
          <p className="mt-6 rounded-md border border-dashed border-sand-line bg-paper/60 p-6 text-center text-sm text-ink-soft">
            Online learning hasn&apos;t been turned on for you yet -- ask your teacher.
          </p>
        </div>
      </div>
    );
  }

  const [schedule, programme] = await Promise.all([
    getChildOnlineScheduleWithNextLessons(session.childId),
    getChildOnlineProgrammeTerms(session.childId),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-cream px-6 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div>
          <p className="font-script text-3xl text-orange-deep">Hi {child.child_nickname || child.child_full_name}!</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Your Online Learning</h1>
        </div>

        <StudentNav active="/student/online-learning" showOnlineLearning />

        <div className="mt-6">
          <OnlineLearningScheduleBoard slots={schedule} buildLessonHref={(lessonId) => `/student/curriculum/lesson/${lessonId}`} />
        </div>

        {programme.length > 0 && (
          <div className="mt-8 rounded-md border border-sand-line bg-paper p-5 shadow-soft">
            <h2 className="font-display text-base font-semibold text-teal-deep">Your programme</h2>
            <ul className="mt-2 flex flex-col gap-1">
              {programme.map((t) => (
                <li key={t.id} className="text-sm text-ink-soft">
                  <span className="font-semibold text-ink">{t.subject}</span> · {t.term_label}
                </li>
              ))}
            </ul>
            <Link href="/student/curriculum" className="mt-3 inline-block text-sm font-semibold text-teal-deep hover:underline">
              Browse the full curriculum →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
