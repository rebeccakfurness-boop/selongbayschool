import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import {
  getRosterWithSubmissionsForOccurrence,
  getRubricCriteria,
  getClassNameForOccurrence,
  upsertWorksheetSubmission,
} from '@/lib/worksheets';

/** Teacher/admin side: GET returns the whole class roster for a session (who's submitted, who
 * hasn't, and their current mark if any) plus the rubric criteria list, so the marking UI can
 * render everything in one call. POST lets a teacher upload on a student's behalf — the expected
 * flow for on-site sessions per the agreed default, where the teacher collects physical work. */
export async function GET(req: NextRequest) {
  const staff = await getCurrentStaff();
  const occurrenceId = Number(req.nextUrl.searchParams.get('occurrenceId'));
  if (!Number.isInteger(occurrenceId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const className = await getClassNameForOccurrence(occurrenceId);
    if (!className) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, className))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    const [roster, rubricCriteria] = await Promise.all([
      getRosterWithSubmissionsForOccurrence(occurrenceId),
      getRubricCriteria(),
    ]);
    return NextResponse.json({ roster, rubricCriteria });
  } catch (err) {
    console.error('[api/admin/worksheets] failed to load', err);
    return NextResponse.json({ error: 'Could not load worksheets.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();

  let body: { occurrenceId?: number; childId?: number; fileUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const occurrenceId = Number(body.occurrenceId);
  const childId = Number(body.childId);
  const fileUrl = body.fileUrl;
  if (!Number.isInteger(occurrenceId) || !Number.isInteger(childId) || !fileUrl) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const className = await getClassNameForOccurrence(occurrenceId);
    if (!className) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, className))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    const { id } = await upsertWorksheetSubmission({ occurrenceId, childId, fileUrl, actor: { adminUserId: staff.adminUserId } });
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/admin/worksheets] failed to save', err);
    return NextResponse.json({ error: 'Could not save worksheet.' }, { status: 500 });
  }
}
