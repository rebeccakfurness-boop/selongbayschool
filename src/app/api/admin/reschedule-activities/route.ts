import { NextResponse } from 'next/server';
import { runRescheduleActivities } from '@/lib/reschedule-activities';

export async function POST() {
  try {
    const result = await runRescheduleActivities();
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error('[api/admin/reschedule-activities] failed', err);
    return NextResponse.json({ error: 'Could not reschedule activities.' }, { status: 500 });
  }
}
