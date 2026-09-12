import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { createStaffLunchOrderSchema, firstIssueMessage } from '@/lib/validation';
import { getStaffLunchOrders, createStaffLunchOrder, createStaffOwnLunchRecord } from '@/lib/staff-hr';
import { countLunchDays } from '@/lib/lunch-calc';

/** Mirrors the parent LunchOrderForm/lunch_orders flow, minus invoicing (staff lunches aren't
 * billed to the staff member -- see staff_lunch_orders' own schema comment). GET/POST: admin, or
 * the staff member managing their own lunch request (self-service, same as a parent ordering for
 * their own child). */
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
    const orders = await getStaffLunchOrders(adminUserId);
    return NextResponse.json({ orders });
  } catch (err) {
    console.error('[api/admin/staff/:id/lunch] failed to load', err);
    return NextResponse.json({ error: 'Could not load lunch requests.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const adminUserId = Number(idParam);
  if (!Number.isInteger(adminUserId)) {
    return NextResponse.json({ error: 'Invalid staff id.' }, { status: 400 });
  }
  if (staff.role !== 'admin' && String(staff.adminUserId) !== String(adminUserId)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = createStaffLunchOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error, 'Invalid request.') }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    if (d.ownLunch) {
      await createStaffOwnLunchRecord(adminUserId);
      return NextResponse.json({ ok: true });
    }
    if (!d.startDate || !d.endDate || !d.lunchSize) {
      return NextResponse.json({ error: 'Start date, end date, and lunch size are required.' }, { status: 400 });
    }
    const weekdays = { monday: !!d.monday, tuesday: !!d.tuesday, wednesday: !!d.wednesday, thursday: !!d.thursday, friday: !!d.friday };
    const lunchCount = countLunchDays(d.startDate, d.endDate, weekdays);
    await createStaffLunchOrder(adminUserId, {
      startDate: d.startDate,
      endDate: d.endDate,
      ...weekdays,
      lunchSize: d.lunchSize,
      foodPreference: d.foodPreference ?? null,
      allergiesNotes: d.allergiesNotes ?? null,
      lunchCount,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/staff/:id/lunch] failed to add', err);
    return NextResponse.json({ error: 'Could not save that lunch request.' }, { status: 500 });
  }
}
