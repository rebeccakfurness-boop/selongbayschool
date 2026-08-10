import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { guardianOwnsChild } from '@/lib/lms-data';
import { setLessonProgressSchema } from '@/lib/validation';
import { setChildLessonProgress } from '@/lib/curriculum';

/** Not covered by src/proxy.ts's matcher (/api/account/:path* isn't listed there, same as the
 * lunch-order and schedule-notification routes), so the session and per-child ownership are both
 * checked directly here. */
export async function PATCH(req: NextRequest) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in to update lesson progress.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = setLessonProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    if (!(await guardianOwnsChild(session.customerId, d.childId))) {
      return NextResponse.json({ error: 'Not authorized for this child.' }, { status: 403 });
    }
    await setChildLessonProgress(d.childId, d.lessonId, d.status, { customerId: session.customerId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/account/curriculum/progress] failed to update', err);
    return NextResponse.json({ error: 'Could not save progress.' }, { status: 500 });
  }
}
