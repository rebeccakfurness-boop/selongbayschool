import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { uploadStaffContractSchema } from '@/lib/validation';
import { uploadSignedContract } from '@/lib/staff-contracts';

/** Records an already-executed contract an admin has uploaded through the existing
 * /api/admin/staff/upload Blob route (same PDF/image allowance as CV, passport, etc. -- this
 * route only records the resulting blob URL as a staff_contracts row, locked immediately since
 * it's taken to already be the final signed copy). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const currentStaff = await requireAdmin();
  const { id: idParam } = await params;
  const adminUserId = Number(idParam);
  if (!Number.isInteger(adminUserId)) {
    return NextResponse.json({ error: 'Invalid staff id.' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = uploadStaffContractSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const id = await uploadSignedContract(adminUserId, parsed.data.title, parsed.data.fileUrl, currentStaff.adminUserId);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/admin/staff/:id/contracts/upload] failed', err);
    return NextResponse.json({ error: 'Could not save that contract.' }, { status: 500 });
  }
}
