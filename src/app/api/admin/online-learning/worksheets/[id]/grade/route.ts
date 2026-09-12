import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { getClassNameForLessonWorksheetSubmission, gradeLessonWorksheet } from '@/lib/online-learning';
import { gradeLessonWorksheetSchema } from '@/lib/validation';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id } = await params;
  const submissionId = Number(id);
  if (!Number.isInteger(submissionId)) {
    return NextResponse.json({ error: 'Invalid submission id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = gradeLessonWorksheetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid grade.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const className = await getClassNameForLessonWorksheetSubmission(submissionId);
    if (!className) return NextResponse.json({ error: 'Worksheet not found.' }, { status: 404 });
    if (!(await canAccessClass(staff, className))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    await gradeLessonWorksheet(submissionId, parsed.data.grade, parsed.data.comments ?? null, staff.adminUserId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/online-learning/worksheets/:id/grade] failed', err);
    return NextResponse.json({ error: 'Could not save this grade.' }, { status: 500 });
  }
}
