import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { getClassNameForSubmission, saveWorksheetMark } from '@/lib/worksheets';

/** Numeric score is always required; rubric ratings are optional and layered on top, per the
 * agreed "both" scope — a teacher can mark with just a score, just rubric ratings alongside it, or
 * skip the rubric entirely for a quick mark. */
export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();

  let body: {
    submissionId?: number;
    score?: number;
    maxScore?: number;
    comments?: string | null;
    rubricRatings?: { criterionId: number; rating: number }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const submissionId = Number(body.submissionId);
  const score = Number(body.score);
  const maxScore = Number(body.maxScore ?? 10);
  if (!Number.isInteger(submissionId) || !Number.isFinite(score) || !Number.isFinite(maxScore) || score < 0 || maxScore <= 0) {
    return NextResponse.json({ error: 'Invalid mark.' }, { status: 400 });
  }
  const rubricRatings = Array.isArray(body.rubricRatings)
    ? body.rubricRatings.filter(
        (r) => Number.isInteger(r.criterionId) && Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5
      )
    : [];

  try {
    await ensureSchema();
    const className = await getClassNameForSubmission(submissionId);
    if (!className) {
      return NextResponse.json({ error: 'Worksheet not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, className))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    await saveWorksheetMark({
      submissionId,
      score,
      maxScore,
      comments: body.comments || null,
      markedBy: staff.adminUserId,
      rubricRatings,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/worksheets/mark] failed to save', err);
    return NextResponse.json({ error: 'Could not save mark.' }, { status: 500 });
  }
}
