import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { classScheduleSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();

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

  if (!(await canAccessClass(staff, d.className))) {
    return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
  }

  try {
    await ensureSchema();
    const rows = await sql`
      INSERT INTO class_schedule (class_name, subject, teacher_id, day_of_week, start_time, end_time, format, location_or_link)
      VALUES (${d.className}, ${d.subject}, ${d.teacherId ?? null}, ${d.dayOfWeek}, ${d.startTime}::time, ${d.endTime}::time, ${d.format}, ${d.locationOrLink || null})
      RETURNING id
    `;
    return NextResponse.json({ id: rows[0].id });
  } catch (err) {
    console.error('[api/admin/class-schedule] failed to create', err);
    return NextResponse.json({ error: 'Could not create schedule entry.' }, { status: 500 });
  }
}
