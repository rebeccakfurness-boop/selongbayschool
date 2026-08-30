import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { createGenerationJobSchema } from '@/lib/validation';
import { createGenerationJob } from '@/lib/curriculum-generation';

/** Starts a Course Builder run -- creates the job row only (status 'pending'); the actual
 * syllabus-parse-then-generate work happens across many /step calls the page's own polling loop
 * drives (see job-runner.ts's own comment on why), never in this request. */
export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = createGenerationJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
  }
  const d = parsed.data;

  if (!(await canAccessClass(staff, d.className))) {
    return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
  }

  try {
    await ensureSchema();
    const job = await createGenerationJob({
      className: d.className,
      subject: d.subject,
      termLabel: d.termLabel,
      examBoard: d.examBoard,
      examSeries: d.examSeries,
      frameworkLabel: d.frameworkLabel || null,
      syllabusPdfUrl: d.syllabusPdfUrl,
      workbookPdfUrl: d.workbookPdfUrl || null,
      requestedByAdminUserId: staff.adminUserId,
    });
    return NextResponse.json({ job });
  } catch (err) {
    console.error('[api/admin/curriculum/generation-jobs] failed to create', err);
    return NextResponse.json({ error: 'Could not start course generation.' }, { status: 500 });
  }
}
