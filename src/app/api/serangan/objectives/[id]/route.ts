import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { upsertSeranganObjectiveSchema } from '@/lib/validation';
import { updateObjective, deleteObjective } from '@/lib/serangan';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid objective id.' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = upsertSeranganObjectiveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid objective.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await updateObjective(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/serangan/objectives/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not save that objective.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid objective id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await deleteObjective(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/serangan/objectives/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not remove that objective.' }, { status: 500 });
  }
}
