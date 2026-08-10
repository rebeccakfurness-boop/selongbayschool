import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getStudentSessionOptions, type StudentSessionData } from '@/lib/auth';
import { getCurriculumTermTree, getProgressMapForChild } from '@/lib/curriculum';

/** Backs the student's subject switcher on /student/curriculum. Read-only -- students never set
 * their own progress (only teachers/parents do, per the agreed scope), so this route has no PATCH
 * counterpart, unlike the equivalent parent-facing route. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<StudentSessionData>(await cookies(), await getStudentSessionOptions());
  if (!session.childId) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 403 });
  }

  const { id: idParam } = await params;
  const termId = Number(idParam);
  if (!Number.isInteger(termId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const term = await getCurriculumTermTree(termId);
    if (!term) {
      return NextResponse.json({ error: 'Programme not found.' }, { status: 404 });
    }
    const progressMap = await getProgressMapForChild(session.childId);
    return NextResponse.json({ term, progress: [...progressMap.entries()] });
  } catch (err) {
    console.error('[api/student/curriculum/terms/:id] failed to load', err);
    return NextResponse.json({ error: 'Could not load that subject.' }, { status: 500 });
  }
}
