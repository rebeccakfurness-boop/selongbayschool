import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { guardianOwnsChild } from '@/lib/lms-data';
import { getLessonForOnlineFlow } from '@/lib/curriculum';
import { getAnswersForChild, submitLessonAnswer } from '@/lib/online-learning';
import { submitAnswerSchema } from '@/lib/validation';

/** Mirrors /api/student/curriculum/lessons/:lessonId/answers exactly, for a parent completing (or
 * watching) the self-directed flow alongside their child -- childId is an explicit query param
 * here since one parent account can have several children, same split as every other
 * parent-facing curriculum route. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 403 });
  }

  const { lessonId: idParam } = await params;
  const lessonId = Number(idParam);
  const childId = Number(req.nextUrl.searchParams.get('childId'));
  if (!Number.isInteger(lessonId) || !Number.isInteger(childId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    if (!(await guardianOwnsChild(session.customerId, childId))) {
      return NextResponse.json({ error: 'Not authorized for this child.' }, { status: 403 });
    }
    const found = await getLessonForOnlineFlow(lessonId, childId);
    if (!found) return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });

    const questionIds = [...found.lesson.starter_quiz, ...found.lesson.discussion_questions, ...found.lesson.exit_quiz]
      .filter((q) => q.question_type === 'open_response')
      .map((q) => q.id);
    const answers = await getAnswersForChild(childId, questionIds);
    return NextResponse.json({ answers });
  } catch (err) {
    console.error('[api/account/curriculum/lessons/:lessonId/answers] failed to load', err);
    return NextResponse.json({ error: 'Could not load your answers.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 403 });
  }

  const { lessonId: idParam } = await params;
  const lessonId = Number(idParam);
  const childId = Number(req.nextUrl.searchParams.get('childId'));
  if (!Number.isInteger(lessonId) || !Number.isInteger(childId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
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
    if (!(await guardianOwnsChild(session.customerId, childId))) {
      return NextResponse.json({ error: 'Not authorized for this child.' }, { status: 403 });
    }
    // Same "what" trust check as the student route: confirm the question actually belongs to this
    // (published) lesson before recording an answer against it.
    const found = await getLessonForOnlineFlow(lessonId, childId);
    // String(...): quiz_question_id is a Postgres BIGSERIAL, returned as a string despite its
    // `number` type -- d.quizQuestionId, coerced to a real JS number by the zod schema, would
    // otherwise never strictly-equal it.
    const belongs =
      found &&
      [...found.lesson.starter_quiz, ...found.lesson.discussion_questions, ...found.lesson.exit_quiz].some(
        (q) => String(q.id) === String(d.quizQuestionId)
      );
    if (!belongs) {
      return NextResponse.json({ error: 'That question is not part of this lesson.' }, { status: 400 });
    }

    await submitLessonAnswer(childId, d.quizQuestionId, { answerText: d.answerText ?? null, answerAudioUrl: d.answerAudioUrl ?? null });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/account/curriculum/lessons/:lessonId/answers] failed to submit', err);
    return NextResponse.json({ error: 'Could not save your answer.' }, { status: 500 });
  }
}
