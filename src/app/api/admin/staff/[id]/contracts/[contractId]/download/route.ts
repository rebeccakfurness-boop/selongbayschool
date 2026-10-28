import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { verifyStaffContractPinSchema } from '@/lib/validation';
import { getContract, isValidContractAccessCode } from '@/lib/staff-contracts';

/** The password-protection this app can actually guarantee (see the schema comment on
 * staff_contracts in lib/db.ts for why a real PDF-embedded open password isn't). An admin gets
 * the file straight away, same as every other staff document. A not-yet-locked contract (still a
 * draft the staff member is being asked to review, or already sent but not yet signed) is also
 * served straight away to its owner -- they have to be able to read it before they can sign it.
 * Only once a contract is locked (signed, or an admin-uploaded already-executed copy) does the
 * owner have to type the access code first -- never trust a client-supplied "the PIN matched",
 * always re-check it here even though the UI also only shows the prompt when locked. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; contractId: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam, contractId: contractIdParam } = await params;
  const adminUserId = Number(idParam);
  const contractId = Number(contractIdParam);
  if (!Number.isInteger(adminUserId) || !Number.isInteger(contractId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const isAdmin = staff.role === 'admin';
  const isOwner = String(staff.adminUserId) === String(adminUserId);
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  try {
    await ensureSchema();
    const contract = await getContract(contractId);
    if (!contract || String(contract.admin_user_id) !== String(adminUserId) || contract.status === 'draft') {
      return NextResponse.json({ error: 'Contract not found.' }, { status: 404 });
    }
    if (!contract.file_url) {
      return NextResponse.json({ error: 'This contract has no file yet.' }, { status: 409 });
    }

    if (!isAdmin && contract.locked) {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: 'Enter the access code.' }, { status: 400 });
      }
      const parsed = verifyStaffContractPinSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Enter the access code.' }, { status: 400 });
      }
      if (!isValidContractAccessCode(parsed.data.pin)) {
        return NextResponse.json({ error: 'That access code is incorrect.' }, { status: 403 });
      }
    }

    return NextResponse.json({ url: contract.file_url, title: contract.title });
  } catch (err) {
    console.error('[api/admin/staff/:id/contracts/:contractId/download] failed', err);
    return NextResponse.json({ error: 'Could not open this contract.' }, { status: 500 });
  }
}
