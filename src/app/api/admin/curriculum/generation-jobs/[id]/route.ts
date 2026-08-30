import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { getGenerationJob } from '@/lib/curriculum-generation';

/** Status poll -- the Course Builder page's client-side loop calls this after every /step call
 * (and once on mount, to resume a job that was already running when the page loads/reloads). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid job id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const job = await getGenerationJob(id);
    if (!job) {
      return NextResponse.json({ error: 'Generation job not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, job.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }
    return NextResponse.json({ job });
  } catch (err) {
    console.error('[api/admin/curriculum/generation-jobs/:id] failed to load', err);
    return NextResponse.json({ error: 'Could not load generation job.' }, { status: 500 });
  }
}
