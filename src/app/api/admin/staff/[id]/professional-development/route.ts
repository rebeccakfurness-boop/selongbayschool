import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { addProfessionalDevelopmentSchema, firstIssueMessage } from '@/lib/validation';
import { getProfessionalDevelopmentForStaff, addProfessionalDevelopment } from '@/lib/staff-hr';

/** GET: admin, or the staff member viewing their own record (self-service "what PD have I got
 * booked" read). POST: admin-only -- PD is booked/logged by HR, not self-reported. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const adminUserId = Number(idParam);
  if (!Number.isInteger(adminUserId)) {
    return NextResponse.json({ error: 'Invalid staff id.' }, { status: 400 });
  }
  // String(...): session.adminUserId is only ever type-asserted as `number` at login
  // (src/app/api/admin/login/route.ts), never actually converted -- it's a raw BIGSERIAL string
  // at runtime, same as every other id in this codebase. A plain !== here would always reject.
  if (staff.role !== 'admin' && String(staff.adminUserId) !== String(adminUserId)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  try {
    await ensureSchema();
    const entries = await getProfessionalDevelopmentForStaff(adminUserId);
    return NextResponse.json({ entries });
  } catch (err) {
    console.error('[api/admin/staff/:id/professional-development] failed to load', err);
    return NextResponse.json({ error: 'Could not load professional development.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  if (staff.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can log professional development.' }, { status: 403 });
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
  const parsed = addProfessionalDevelopmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error, 'Invalid entry.') }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const id = await addProfessionalDevelopment(adminUserId, {
      title: d.title,
      provider: d.provider ?? null,
      startDate: d.startDate ?? null,
      endDate: d.endDate ?? null,
      status: d.status,
      notes: d.notes ?? null,
    });
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/admin/staff/:id/professional-development] failed to add', err);
    return NextResponse.json({ error: 'Could not add that entry.' }, { status: 500 });
  }
}
