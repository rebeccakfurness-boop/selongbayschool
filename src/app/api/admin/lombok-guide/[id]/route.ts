import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { upsertLombokGuideEntrySchema } from '@/lib/validation';
import { updateGuideEntry, deleteGuideEntry } from '@/lib/lombok-guide';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid entry id.' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = upsertLombokGuideEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid entry.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await updateGuideEntry(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/lombok-guide/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not save that entry.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid entry id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await deleteGuideEntry(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/lombok-guide/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not remove that entry.' }, { status: 500 });
  }
}
