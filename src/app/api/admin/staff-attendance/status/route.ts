import { NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { getTodayEventStatusForStaff } from '@/lib/staff-attendance';

/** Backs the self check-in/out button (Overview page) -- today's status for the logged-in staff
 * member, so the button knows whether to offer "Check In" or "Check Out" on first render. */
export async function GET() {
  const staff = await getCurrentStaff();
  try {
    await ensureSchema();
    const status = await getTodayEventStatusForStaff(staff.adminUserId);
    return NextResponse.json({ ok: true, eventType: status?.event_type ?? null, occurredAt: status?.occurred_at ?? null });
  } catch (err) {
    console.error('[api/admin/staff-attendance/status] failed', err);
    return NextResponse.json({ error: 'Could not load status.' }, { status: 500 });
  }
}
