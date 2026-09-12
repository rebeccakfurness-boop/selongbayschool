import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { verifyPayslipDobSchema } from '@/lib/validation';
import { getPayslipWithOwnerDob } from '@/lib/staff-hr';

/** The password-protection this app can actually guarantee (see the schema comment on
 * staff_payslips in lib/db.ts for why a real PDF-embedded open password isn't -- no dependency in
 * this repo can set one, and the realistic options all need a native/binary dependency unverified
 * against this deployment). An admin gets the file straight away; the owning staff member must
 * submit their own date of birth first, checked here against admin_users.dob -- never trust a
 * client-supplied "I am this person," always re-check server-side even though the UI also only
 * shows the DOB prompt to the owner. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; payslipId: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam, payslipId: payslipIdParam } = await params;
  const adminUserId = Number(idParam);
  const payslipId = Number(payslipIdParam);
  if (!Number.isInteger(adminUserId) || !Number.isInteger(payslipId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const isAdmin = staff.role === 'admin';
  const isOwner = String(staff.adminUserId) === String(adminUserId);
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  try {
    await ensureSchema();
    const payslip = await getPayslipWithOwnerDob(payslipId);
    if (!payslip || String(payslip.admin_user_id) !== String(adminUserId)) {
      return NextResponse.json({ error: 'Payslip not found.' }, { status: 404 });
    }

    if (!isAdmin) {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
      }
      const parsed = verifyPayslipDobSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Enter your date of birth.' }, { status: 400 });
      }
      if (!payslip.dob) {
        return NextResponse.json({ error: 'No date of birth on file — ask an admin to add it to your Staff Card.' }, { status: 409 });
      }
      if (parsed.data.dob !== payslip.dob) {
        return NextResponse.json({ error: 'That date of birth doesn’t match our records.' }, { status: 403 });
      }
    }

    return NextResponse.json({ url: payslip.file_url, periodLabel: payslip.period_label });
  } catch (err) {
    console.error('[api/admin/staff/:id/payslips/:payslipId/download] failed', err);
    return NextResponse.json({ error: 'Could not open this payslip.' }, { status: 500 });
  }
}
