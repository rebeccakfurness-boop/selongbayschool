import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { guardianOwnsChild } from '@/lib/lms-data';
import { getLessonForOnlineFlow, getOnlineProgress, upsertOnlineProgressStep } from '@/lib/curriculum';
import { onlineProgressStepSchema } from '@/lib/validation';

/** Backs a parent doing the "Complete online" flow alongside (or on behalf of) their child
 * (/account/learning/lesson/:lessonId?childId=...) -- childId is explicit here, unlike the student
 * route, since one parent account can have several children, same split as every other
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
    if (!found) {
      return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
    }
    const progress = await getOnlineProgress(childId, lessonId);
    return NextResponse.json({ lesson: found.lesson, unitTitle: found.unitTitle, term: found.term, progress });
  } catch (err) {
    console.error('[api/account/curriculum/lessons/:lessonId/online] failed to load', err);
    return NextResponse.json({ error: 'Could not load this lesson.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
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
  const childId = parsed.data.childId;
  if (!childId) {
    return NextResponse.json({ error: 'childId is required.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    if (!(await guardianOwnsChild(session.customerId, childId))) {
      return NextResponse.json({ error: 'Not authorized for this child.' }, { status: 403 });
    }
    await upsertOnlineProgressStep(childId, lessonId, parsed.data, { customerId: session.customerId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/account/curriculum/lessons/:lessonId/online] failed to update', err);
    return NextResponse.json({ error: 'Could not save progress.' }, { status: 500 });
  }
}
