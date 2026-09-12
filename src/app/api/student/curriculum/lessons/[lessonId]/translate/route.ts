import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getStudentSessionOptions, type StudentSessionData } from '@/lib/auth';
import { getOrCreateLessonTranslation, type LessonLanguage } from '@/lib/curriculum-translation';

const LANGUAGES: LessonLanguage[] = ['fr', 'id', 'es'];

/** Backs the language switcher on the student's "Complete online" flow — translation only
 * (see getOrCreateLessonTranslation), never re-scored: the flow always keeps grading against the
 * original English question's correct_option_index, matched by TranslatedQuizQuestion.id. */
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

  const lang = req.nextUrl.searchParams.get('lang');
  if (!lang || !LANGUAGES.includes(lang as LessonLanguage)) {
    return NextResponse.json({ error: 'Unsupported language.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const content = await getOrCreateLessonTranslation(lessonId, lang as LessonLanguage);
    return NextResponse.json({ content });
  } catch (err) {
    console.error('[api/student/curriculum/lessons/:lessonId/translate] failed', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not translate this lesson right now.' }, { status: 502 });
  }
}
