import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { sendContract, getContract } from '@/lib/staff-contracts';
import { getStaffDetail } from '@/lib/staff-hr';
import { sendStaffContractReadyEmail } from '@/lib/email';

/** Moves a previously-saved draft to 'sent' (the admin chose "Send to staff" on an existing
 * draft rather than at generation time) and emails the staff member -- same notification
 * generate.ts sends when send:true is chosen up front. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; contractId: string }> }) {
  await requireAdmin();
  const { id: idParam, contractId: contractIdParam } = await params;
  const adminUserId = Number(idParam);
  const contractId = Number(contractIdParam);
  if (!Number.isInteger(adminUserId) || !Number.isInteger(contractId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const contract = await getContract(contractId);
    if (!contract || String(contract.admin_user_id) !== String(adminUserId)) {
      return NextResponse.json({ error: 'Contract not found.' }, { status: 404 });
    }
    if (contract.status !== 'draft') {
      return NextResponse.json({ error: 'That contract has already been sent.' }, { status: 409 });
    }

    await sendContract(contractId);

    const staff = await getStaffDetail(adminUserId);
    if (staff) {
      const employeeName = staff.display_name ?? staff.email;
      await sendStaffContractReadyEmail({ toEmail: staff.email, staffName: employeeName, title: contract.title, adminUserId });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/staff/:id/contracts/:contractId/send] failed', err);
    return NextResponse.json({ error: 'Could not send that contract.' }, { status: 500 });
  }
}
