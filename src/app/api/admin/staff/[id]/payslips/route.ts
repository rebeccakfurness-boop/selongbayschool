import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { generatePayslipSchema, firstIssueMessage } from '@/lib/validation';
import { getPayslipsForStaff, generatePayslip } from '@/lib/staff-hr';

/** GET: admin, or the staff member listing their own payslips (period labels + dates only --
 * actually opening one goes through the separate DOB-gated download route). POST: admin-only. */
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  if (staff.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can generate payslips.' }, { status: 403 });
  }

  const { id: idParam } = await params;
  const adminUserId = Number(idParam);
  if (!Number.isInteger(adminUserId)) {
    return NextResponse.json({ error: 'Invalid staff id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = generatePayslipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error, 'Invalid payslip.') }, { status: 400 });
  }

  try {
    await ensureSchema();
    const id = await generatePayslip(adminUserId, parsed.data, staff.adminUserId);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/admin/staff/:id/payslips] failed to generate', err);
    return NextResponse.json({ error: `Could not generate that payslip: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
