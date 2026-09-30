import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { toggleCcaSelectionItemSchema } from '@/lib/validation';
import { toggleCcaSelectionItemExcluded } from '@/lib/cca';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid item id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = toggleCcaSelectionItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await toggleCcaSelectionItemExcluded(id, parsed.data.excluded);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/cca/selection-items/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not update item.' }, { status: 500 });
  }
}
