import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getStudentSessionOptions, type StudentSessionData } from '@/lib/auth';
import { getLessonForOnlineFlow } from '@/lib/curriculum';
import { getLessonWorksheetSubmission, submitLessonWorksheet } from '@/lib/online-learning';
import { submitLessonWorksheetSchema } from '@/lib/validation';

export async function GET(req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await getIronSession<StudentSessionData>(await cookies(), await getStudentSessionOptions());
  if (!session.childId) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 403 });
  }

  const { lessonId: idParam } = await params;
  const lessonId = Number(idParam);
  if (!Number.isInteger(lessonId)) {
    return NextResponse.json({ error: 'Invalid lesson id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const submission = await getLessonWorksheetSubmission(lessonId, session.childId);
    return NextResponse.json({ submission });
  } catch (err) {
    console.error('[api/student/curriculum/lessons/:lessonId/worksheet] failed to load', err);
    return NextResponse.json({ error: 'Could not load your worksheet.' }, { status: 500 });
  }
}

/** Records the completed worksheet a student uploaded (via /api/student/upload) for this lesson
 * — see submitLessonWorksheet for the resubmission behaviour. A teacher marks it from the admin
 * Online Learning section (getLessonWorksheetsForReview / gradeLessonWorksheet). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await getIronSession<StudentSessionData>(await cookies(), await getStudentSessionOptions());
  if (!session.childId) {
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
  const parsed = submitLessonWorksheetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid submission.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const found = await getLessonForOnlineFlow(lessonId, session.childId);
    if (!found) return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });

    await submitLessonWorksheet(lessonId, session.childId, {
      fileUrl: parsed.data.fileUrl ?? null,
      answerAudioUrl: parsed.data.answerAudioUrl ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/student/curriculum/lessons/:lessonId/worksheet] failed to submit', err);
    return NextResponse.json({ error: 'Could not save your worksheet.' }, { status: 500 });
  }
}
