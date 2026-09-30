import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { updateCcaOptionSchema } from '@/lib/validation';
import { updateCcaOption, deleteCcaOption } from '@/lib/cca';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ optionId: string }> }) {
  await requireAdmin();
  const { optionId: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid option id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = updateCcaOptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await updateCcaOption(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/cca/activities/:id/options/:optionId] failed to update', err);
    return NextResponse.json({ error: 'Could not update option.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ optionId: string }> }) {
  await requireAdmin();
  const { optionId: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid option id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await deleteCcaOption(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/cca/activities/:id/options/:optionId] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete option.' }, { status: 500 });
  }
}
