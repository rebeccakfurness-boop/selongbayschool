import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { redirect, notFound } from 'next/navigation';
import { ensureSchema } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { guardianOwnsChild } from '@/lib/lms-data';
import { getLessonForOnlineFlow, getOnlineProgress } from '@/lib/curriculum';
import LessonOnlineFlow from '@/components/curriculum/LessonOnlineFlow';

export const dynamic = 'force-dynamic';

export default async function ParentLessonOnlinePage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ childId?: string }>;
}) {
  await ensureSchema();
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    redirect('/account/login');
  }

  const { lessonId: idParam } = await params;
  const { childId: childIdParam } = await searchParams;
  const lessonId = Number(idParam);
  const childId = Number(childIdParam);
  if (!Number.isInteger(lessonId) || !Number.isInteger(childId)) {
    notFound();
  }
  if (!(await guardianOwnsChild(session.customerId, childId))) {
    notFound();
  }

  const found = await getLessonForOnlineFlow(lessonId);
  if (!found) {
    notFound();
  }
  const progress = await getOnlineProgress(childId, lessonId);

  return (
    <div className="min-h-screen bg-cream">
      <LessonOnlineFlow
        lesson={found.lesson}
        unitTitle={found.unitTitle}
        term={found.term}
        initialProgress={progress}
        apiBase={`/api/account/curriculum/lessons/${lessonId}/online?childId=${childId}`}
        backHref={`/account/learning#child-${childId}`}
      />
    </div>
  );
}
