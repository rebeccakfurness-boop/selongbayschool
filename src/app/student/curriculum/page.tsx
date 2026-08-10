import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getStudentSessionOptions, type StudentSessionData } from '@/lib/auth';
import { getCurriculumTermsForClass, getCurriculumTermTree, getProgressMapForChild } from '@/lib/curriculum';
import StudentNav from '@/components/student/StudentNav';
import StudentCurriculumSection from '@/components/student/StudentCurriculumSection';

export const dynamic = 'force-dynamic';

export default async function StudentCurriculumPage() {
  await ensureSchema();
  const session = await getIronSession<StudentSessionData>(await cookies(), await getStudentSessionOptions());

  const [child] = (await sql`
    SELECT child_full_name, child_nickname, class_name FROM children WHERE id = ${session.childId}
  `) as unknown as { child_full_name: string; child_nickname: string | null; class_name: string | null }[];

  const terms = await getCurriculumTermsForClass(child?.class_name ?? null);
  const [initialTerm, progressMap] =
    terms.length > 0 && session.childId
      ? await Promise.all([getCurriculumTermTree(terms[0].id), getProgressMapForChild(session.childId)])
      : [null, new Map()];

  return (
    <div className="flex min-h-screen flex-col bg-cream px-6 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div>
          <p className="font-script text-3xl text-orange-deep">Hi {child?.child_nickname || child?.child_full_name || 'there'}!</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
            {child?.class_name ? `${child.class_name} · ` : ''}Curriculum
          </h1>
        </div>

        <StudentNav active="/student/curriculum" />

        <div className="mt-6">
          <StudentCurriculumSection terms={terms} initialTerm={initialTerm} initialProgress={[...progressMap.entries()]} />
        </div>
      </div>
    </div>
  );
}
