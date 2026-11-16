import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { upsertSeranganGoalSchema } from '@/lib/validation';
import { updateGoal, deleteGoal } from '@/lib/serangan';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid goal id.' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = upsertSeranganGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid goal.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await updateGoal(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/serangan/goals/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not save that goal.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid goal id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await deleteGoal(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/serangan/goals/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not remove that goal.' }, { status: 500 });
  }
}
