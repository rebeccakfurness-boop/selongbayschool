import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { guardianOwnsChild } from '@/lib/lms-data';
import { getLessonForOnlineFlow } from '@/lib/curriculum';
import { getLessonWorksheetSubmission, submitLessonWorksheet } from '@/lib/online-learning';
import { submitLessonWorksheetSchema } from '@/lib/validation';

/** Mirrors /api/student/curriculum/lessons/:lessonId/worksheet, for a parent uploading their
 * child's completed worksheet from the self-directed flow (/account/learning/lesson/:lessonId).
 * See that route for the resubmission behaviour -- a teacher marks it from the admin Online
 * Learning section either way. */
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
    const submission = await getLessonWorksheetSubmission(lessonId, childId);
    return NextResponse.json({ submission });
  } catch (err) {
    console.error('[api/account/curriculum/lessons/:lessonId/worksheet] failed to load', err);
    return NextResponse.json({ error: 'Could not load your worksheet.' }, { status: 500 });
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
  const parsed = submitLessonWorksheetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid submission.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    if (!(await guardianOwnsChild(session.customerId, childId))) {
      return NextResponse.json({ error: 'Not authorized for this child.' }, { status: 403 });
    }
    const found = await getLessonForOnlineFlow(lessonId, childId);
    if (!found) return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });

    await submitLessonWorksheet(lessonId, childId, {
      fileUrl: parsed.data.fileUrl ?? null,
      answerAudioUrl: parsed.data.answerAudioUrl ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/account/curriculum/lessons/:lessonId/worksheet] failed to submit', err);
    return NextResponse.json({ error: 'Could not save your worksheet.' }, { status: 500 });
  }
}
