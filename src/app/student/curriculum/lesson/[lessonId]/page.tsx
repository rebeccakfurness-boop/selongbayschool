import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { redirect, notFound } from 'next/navigation';
import { ensureSchema } from '@/lib/db';
import { getStudentSessionOptions, type StudentSessionData } from '@/lib/auth';
import { getLessonForOnlineFlow, getOnlineProgress } from '@/lib/curriculum';
import LessonOnlineFlow from '@/components/curriculum/LessonOnlineFlow';

export const dynamic = 'force-dynamic';

export default async function StudentLessonOnlinePage({ params }: { params: Promise<{ lessonId: string }> }) {
  await ensureSchema();
  const session = await getIronSession<StudentSessionData>(await cookies(), await getStudentSessionOptions());
  if (!session.childId) {
    redirect('/student/login');
  }

  const { lessonId: idParam } = await params;
  const lessonId = Number(idParam);
  if (!Number.isInteger(lessonId)) {
    notFound();
  }

  const found = await getLessonForOnlineFlow(lessonId, session.childId);
  if (!found) {
    notFound();
  }
  const progress = await getOnlineProgress(session.childId, lessonId);

  return (
    <div className="min-h-screen bg-cream">
      <LessonOnlineFlow
        lesson={found.lesson}
        unitTitle={found.unitTitle}
        term={found.term}
        initialProgress={progress}
        apiBase={`/api/student/curriculum/lessons/${lessonId}/online`}
        backHref="/student/curriculum"
      />
    </div>
  );
}
