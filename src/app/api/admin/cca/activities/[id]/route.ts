import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { updateCcaActivitySchema } from '@/lib/validation';
import { updateCcaActivity, deleteCcaActivity } from '@/lib/cca';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid CCA id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = updateCcaActivitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await updateCcaActivity(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/cca/activities/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not update CCA.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid CCA id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const result = await deleteCcaActivity(id);
    if (!result.ok) {
      return NextResponse.json({ error: 'This CCA has already been selected by a parent and can’t be deleted. Mark it inactive instead.' }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/cca/activities/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete CCA.' }, { status: 500 });
  }
}
