import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const codeId = Number(id);
  if (!Number.isInteger(codeId)) {
    return NextResponse.json({ error: 'Invalid code id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const isActive = (body as { isActive?: unknown }).isActive;
  if (typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'isActive must be a boolean.' }, { status: 400 });
  }

  try {
    await sql`UPDATE library_discount_codes SET is_active = ${isActive} WHERE id = ${codeId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/library/discount-codes/:id] failed', err);
    return NextResponse.json({ error: 'Could not update this code.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const codeId = Number(id);
  if (!Number.isInteger(codeId)) {
    return NextResponse.json({ error: 'Invalid code id.' }, { status: 400 });
  }

  try {
    await sql`DELETE FROM library_discount_codes WHERE id = ${codeId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/library/discount-codes/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete this code.' }, { status: 500 });
  }
}
