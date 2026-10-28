import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { upsertPartnerDiscountSchema } from '@/lib/validation';
import { updatePartnerDiscount, deletePartnerDiscount } from '@/lib/family-discount';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid discount id.' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = upsertPartnerDiscountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid discount.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await updatePartnerDiscount(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/partner-discounts/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not save that discount.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid discount id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await deletePartnerDiscount(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/partner-discounts/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not remove that discount.' }, { status: 500 });
  }
}
