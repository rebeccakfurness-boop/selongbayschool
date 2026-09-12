import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getStudentSessionOptions, type StudentSessionData } from '@/lib/auth';
import { getLessonForOnlineFlow } from '@/lib/curriculum';
import { getAnswersForChild, submitLessonAnswer } from '@/lib/online-learning';
import { submitAnswerSchema } from '@/lib/validation';

/** GET returns this student's own answers (+ grade/comment once marked) for every open_response
 * question in the lesson, so OpenResponseStep can show "graded" state without a separate call per
 * question. POST records one answer -- see submitLessonAnswer for the resubmission behaviour. */
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
    const found = await getLessonForOnlineFlow(lessonId, session.childId);
    if (!found) return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });

    const questionIds = [...found.lesson.starter_quiz, ...found.lesson.exit_quiz]
      .filter((q) => q.question_type === 'open_response')
      .map((q) => q.id);
    const answers = await getAnswersForChild(session.childId, questionIds);
    return NextResponse.json({ answers });
  } catch (err) {
    console.error('[api/student/curriculum/lessons/:lessonId/answers] failed to load', err);
    return NextResponse.json({ error: 'Could not load your answers.' }, { status: 500 });
  }
}

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
  const parsed = submitAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid answer.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    // Confirms the question actually belongs to this (published) lesson before recording an
    // answer against it — the same trust boundary as every other student route (session childId
    // only, never a body-supplied id, for who; this is the equivalent check for what).
    const found = await getLessonForOnlineFlow(lessonId, session.childId);
    const belongs = found && [...found.lesson.starter_quiz, ...found.lesson.exit_quiz].some((q) => q.id === d.quizQuestionId);
    if (!belongs) {
      return NextResponse.json({ error: 'That question is not part of this lesson.' }, { status: 400 });
    }

    await submitLessonAnswer(session.childId, d.quizQuestionId, { answerText: d.answerText ?? null, answerAudioUrl: d.answerAudioUrl ?? null });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/student/curriculum/lessons/:lessonId/answers] failed to submit', err);
    return NextResponse.json({ error: 'Could not save your answer.' }, { status: 500 });
  }
}
