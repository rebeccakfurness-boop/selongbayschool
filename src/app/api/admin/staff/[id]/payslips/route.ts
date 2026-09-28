import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { getPayslipsForStaff } from '@/lib/staff-hr';

/** GET: admin, or the staff member listing their own payslips (period labels + dates only --
 * actually opening one goes through the separate DOB-gated download route). Generating a new
 * payslip is a separate POST under the Pages Router instead of a POST here -- see
 * pages/api/admin/staff/[id]/payslips/generate.ts for why (same @react-pdf/renderer + App Router
 * bug as /api/invoices/[id]/pdf.ts). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const adminUserId = Number(idParam);
  if (!Number.isInteger(adminUserId)) {
    return NextResponse.json({ error: 'Invalid staff id.' }, { status: 400 });
  }
  if (staff.role !== 'admin' && String(staff.adminUserId) !== String(adminUserId)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  try {
    await ensureSchema();
    const payslips = await getPayslipsForStaff(adminUserId);
    return NextResponse.json({ payslips });
  } catch (err) {
    console.error('[api/admin/staff/:id/payslips] failed to load', err);
    return NextResponse.json({ error: 'Could not load payslips.' }, { status: 500 });
  }
}
