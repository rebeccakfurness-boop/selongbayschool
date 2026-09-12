import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { guardianOwnsChild } from '@/lib/lms-data';
import { getOrCreateLessonTranslation, type LessonLanguage } from '@/lib/curriculum-translation';

const LANGUAGES: LessonLanguage[] = ['fr', 'id', 'es'];

/** Mirrors /api/student/curriculum/lessons/:lessonId/translate -- backs the language switcher on
 * a parent's "Complete online" view. Translation only, never re-scored (see that route). */
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

  const lang = req.nextUrl.searchParams.get('lang');
  if (!lang || !LANGUAGES.includes(lang as LessonLanguage)) {
    return NextResponse.json({ error: 'Unsupported language.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    if (!(await guardianOwnsChild(session.customerId, childId))) {
      return NextResponse.json({ error: 'Not authorized for this child.' }, { status: 403 });
    }
    const content = await getOrCreateLessonTranslation(lessonId, lang as LessonLanguage);
    return NextResponse.json({ content });
  } catch (err) {
    console.error('[api/account/curriculum/lessons/:lessonId/translate] failed', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not translate this lesson right now.' }, { status: 502 });
  }
}
