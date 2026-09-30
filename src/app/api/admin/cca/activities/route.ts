import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { createCcaActivitySchema } from '@/lib/validation';
import { getAllCcaActivitiesForAdmin, createCcaActivity } from '@/lib/cca';

export const dynamic = 'force-dynamic';

export async function GET() {
  await requireAdmin();
  await ensureSchema();
  const activities = await getAllCcaActivitiesForAdmin();
  return NextResponse.json({ activities });
}

export async function POST(req: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = createCcaActivitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid CCA.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const id = await createCcaActivity(parsed.data);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/admin/cca/activities] failed to create', err);
    return NextResponse.json({ error: 'Could not create CCA.' }, { status: 500 });
  }
}
