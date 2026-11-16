import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentSeranganAdmin } from '@/lib/current-serangan';
import { upsertSeranganObjectiveSchema } from '@/lib/validation';
import { getObjectivesWithGoals, createObjective } from '@/lib/serangan';

export async function GET() {
  await ensureSchema();
  const objectives = await getObjectivesWithGoals();
  return NextResponse.json({ objectives });
}

export async function POST(req: NextRequest) {
  const staff = await getCurrentSeranganAdmin();
  const body = await req.json().catch(() => null);
  const parsed = upsertSeranganObjectiveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid objective.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const id = await createObjective(parsed.data, staff.seranganAdminId);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/serangan/objectives] failed to create', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not save that objective.' }, { status: 400 });
  }
}
