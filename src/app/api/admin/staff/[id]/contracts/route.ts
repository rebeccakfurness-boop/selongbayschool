import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { getContractsForStaff } from '@/lib/staff-contracts';

/** GET: admin, or the staff member listing their own contracts (metadata only -- opening one
 * goes through the separate access-code-gated download route, generating/sending/signing/
 * uploading/deleting each have their own dedicated routes next to this one). An admin sees
 * drafts too; the owning staff member never does. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const adminUserId = Number(idParam);
  if (!Number.isInteger(adminUserId)) {
    return NextResponse.json({ error: 'Invalid staff id.' }, { status: 400 });
  }
  const isAdmin = staff.role === 'admin';
  const isOwner = String(staff.adminUserId) === String(adminUserId);
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  try {
    await ensureSchema();
    const contracts = await getContractsForStaff(adminUserId, isAdmin);
    return NextResponse.json({ contracts });
  } catch (err) {
    console.error('[api/admin/staff/:id/contracts] failed to load', err);
    return NextResponse.json({ error: 'Could not load contracts.' }, { status: 500 });
  }
}
