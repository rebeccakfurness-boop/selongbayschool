import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getStudentSessionOptions, type StudentSessionData } from '@/lib/auth';
import {
  getWorksheetForOccurrenceChild,
  upsertWorksheetSubmission,
  getEffectiveFormatForChild,
  getClassNameForOccurrence,
} from '@/lib/worksheets';

/** Student's own view of the same worksheet flow as the parent route — scoped entirely to the
 * logged-in student's own childId from their session (see student_accounts: one account per
 * child), never a body/query parameter, so a student can't reference another child's session. */
export async function GET(req: NextRequest) {
  const session = await getIronSession<StudentSessionData>(await cookies(), await getStudentSessionOptions());
  if (!session.childId) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  }

  const occurrenceId = Number(req.nextUrl.searchParams.get('occurrenceId'));
  if (!Number.isInteger(occurrenceId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const detail = await getWorksheetForOccurrenceChild(occurrenceId, session.childId);
    return NextResponse.json({ worksheet: detail });
  } catch (err) {
    console.error('[api/student/worksheets] failed to load', err);
    return NextResponse.json({ error: 'Could not load worksheet.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<StudentSessionData>(await cookies(), await getStudentSessionOptions());
  if (!session.childId || !session.studentAccountId) {
    return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  }

  let body: { occurrenceId?: number; fileUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const occurrenceId = Number(body.occurrenceId);
  const fileUrl = body.fileUrl;
  if (!Number.isInteger(occurrenceId) || !fileUrl) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const className = await getClassNameForOccurrence(occurrenceId);
    if (!className) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }
    const format = await getEffectiveFormatForChild(occurrenceId, session.childId);
    if (format !== 'online') {
      return NextResponse.json(
        { error: 'This session is in person — your teacher uploads the completed worksheet for on-site sessions.' },
        { status: 403 }
      );
    }

    const { id } = await upsertWorksheetSubmission({
      occurrenceId,
      childId: session.childId,
      fileUrl,
      actor: { studentAccountId: session.studentAccountId },
    });
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/student/worksheets] failed to save', err);
    return NextResponse.json({ error: 'Could not save worksheet.' }, { status: 500 });
  }
}
