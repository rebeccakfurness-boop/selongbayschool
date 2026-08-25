import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getStudentSessionOptions, type StudentSessionData } from '@/lib/auth';
import { getLessonForOnlineFlow, getOnlineProgress, upsertOnlineProgressStep } from '@/lib/curriculum';
import { onlineProgressStepSchema } from '@/lib/validation';

/** Backs the student's own "Complete online" flow (/student/curriculum/lesson/:lessonId) --
 * childId always comes from the session, same as every other student-facing route, never from
 * the request body. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await getIronSession<StudentSessionData>(await cookies(), await getStudentSessionOptions());
  if (!session.childId || !session.studentAccountId) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 403 });
  }

  const { lessonId: idParam } = await params;
  const lessonId = Number(idParam);
  if (!Number.isInteger(lessonId)) {
    return NextResponse.json({ error: 'Invalid lesson id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const found = await getLessonForOnlineFlow(lessonId, session.childId);
    if (!found) {
      return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
    }
    const progress = await getOnlineProgress(session.childId, lessonId);
    return NextResponse.json({ lesson: found.lesson, unitTitle: found.unitTitle, term: found.term, progress });
  } catch (err) {
    console.error('[api/student/curriculum/lessons/:lessonId/online] failed to load', err);
    return NextResponse.json({ error: 'Could not load this lesson.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await getIronSession<StudentSessionData>(await cookies(), await getStudentSessionOptions());
  if (!session.childId || !session.studentAccountId) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 403 });
  }

  const { lessonId: idParam } = await params;
  const lessonId = Number(idParam);
  if (!Number.isInteger(lessonId)) {
    return NextResponse.json({ error: 'Invalid lesson id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = onlineProgressStepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await upsertOnlineProgressStep(session.childId, lessonId, parsed.data, { studentAccountId: session.studentAccountId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/student/curriculum/lessons/:lessonId/online] failed to update', err);
    return NextResponse.json({ error: 'Could not save your progress.' }, { status: 500 });
  }
}
