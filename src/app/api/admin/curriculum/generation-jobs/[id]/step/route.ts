import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { getGenerationJob, stepGenerationJob } from '@/lib/curriculum-generation';

/** One call = one unit of work (parse the syllabus, or generate+insert one unit) -- see
 * job-runner.ts's own comment on why the whole pipeline is split this way. Vercel's default
 * function timeout is too short for a real Claude call with extended thinking plus docx/PDF
 * generation and blob uploads, so this route gets a generous ceiling; the page's client-side loop
 * still calls it once per step rather than expecting one call to finish the whole course. */
export const maxDuration = 300;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid job id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const existing = await getGenerationJob(id);
    if (!existing) {
      return NextResponse.json({ error: 'Generation job not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, existing.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    const job = await stepGenerationJob(id);
    return NextResponse.json({ job });
  } catch (err) {
    console.error('[api/admin/curriculum/generation-jobs/:id/step] failed', err);
    return NextResponse.json({ error: 'Could not advance course generation.' }, { status: 500 });
  }
}
