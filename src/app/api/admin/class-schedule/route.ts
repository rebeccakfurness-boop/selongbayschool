import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { classScheduleSchema } from '@/lib/validation';
import { regenerateScheduleOccurrences } from '@/lib/academic-calendar';

/** Creating a new weekly slot — time, room, and teacher assignment — is admin-only per the spec
 * (teachers can plan their own sessions' content but not reschedule or reassign). */
export async function POST(req: NextRequest) {
  const staff = await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = classScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid schedule entry.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const rows = await sql`
      INSERT INTO class_schedule (class_name, subject, teacher_id, day_of_week, start_time, end_time, format, location_or_link)
      VALUES (${d.className}, ${d.subject}, ${d.teacherId ?? null}, ${d.dayOfWeek}, ${d.startTime}::time, ${d.endTime}::time, ${d.format}, ${d.locationOrLink || null})
      RETURNING id
    `;
    const id = rows[0].id as number;
    await sql`
      INSERT INTO schedule_session_history (class_schedule_id, changed_by, change_type, old_value, new_value)
      VALUES (${id}, ${staff.adminUserId}, 'created', NULL, ${JSON.stringify(d)}::jsonb)
    `;
    await regenerateScheduleOccurrences({ classScheduleId: id });
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/admin/class-schedule] failed to create', err);
    return NextResponse.json({ error: 'Could not create schedule entry.' }, { status: 500 });
  }
}
