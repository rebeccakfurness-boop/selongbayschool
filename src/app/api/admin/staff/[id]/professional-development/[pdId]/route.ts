import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { deleteProfessionalDevelopment } from '@/lib/staff-hr';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; pdId: string }> }) {
  await requireAdmin();
  const { pdId: pdIdParam } = await params;
  const pdId = Number(pdIdParam);
  if (!Number.isInteger(pdId)) {
    return NextResponse.json({ error: 'Invalid entry id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await deleteProfessionalDevelopment(pdId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/staff/:id/professional-development/:pdId] failed to delete', err);
    return NextResponse.json({ error: 'Could not remove that entry.' }, { status: 500 });
  }
}
