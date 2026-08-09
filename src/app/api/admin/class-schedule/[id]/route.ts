import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, requireAdmin, canAccessClass } from '@/lib/current-staff';
import { updateClassScheduleSchema } from '@/lib/validation';
import { regenerateScheduleOccurrences } from '@/lib/academic-calendar';

interface ExistingRow {
  class_name: string;
  subject: string;
  teacher_id: number | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  format: string;
  location_or_link: string | null;
  meet_link: string | null;
  lesson_plan_id: number | null;
}

/** Fields a teacher may set on their own session: lesson plan and Meet link, the "plan your own
 * week" content the spec grants them. Everything else here — time, room, teacher assignment — is
 * admin-only ("cannot reschedule times, change rooms, or add/remove teachers from a session"). */
const TEACHER_ALLOWED_FIELDS = new Set(['meetLink', 'lessonPlanId']);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid schedule entry id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = updateClassScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }
  const d = parsed.data;
  const fieldsTouched = Object.keys(d).filter((k) => d[k as keyof typeof d] !== undefined);

  try {
    await ensureSchema();
    const [existing] = (await sql`
      SELECT class_name, subject, teacher_id, day_of_week, start_time::text, end_time::text,
        format, location_or_link, meet_link, lesson_plan_id
      FROM class_schedule WHERE id = ${id}
    `) as unknown as ExistingRow[];
    if (!existing) {
      return NextResponse.json({ error: 'Schedule entry not found.' }, { status: 404 });
    }

    if (!(await canAccessClass(staff, existing.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    if (staff.role !== 'admin') {
      const disallowed = fieldsTouched.filter((f) => !TEACHER_ALLOWED_FIELDS.has(f));
      if (disallowed.length > 0) {
        return NextResponse.json(
          { error: 'Only admins can change the time, room, or teacher for a session.' },
          { status: 403 }
        );
      }
      if (existing.teacher_id !== staff.adminUserId) {
        return NextResponse.json({ error: 'You can only edit your own sessions.' }, { status: 403 });
      }
    }

    const merged = {
      subject: d.subject ?? existing.subject,
      teacherId: d.teacherId !== undefined ? d.teacherId : existing.teacher_id,
      dayOfWeek: d.dayOfWeek ?? existing.day_of_week,
      startTime: d.startTime ?? existing.start_time.slice(0, 5),
      endTime: d.endTime ?? existing.end_time.slice(0, 5),
      format: d.format ?? existing.format,
      locationOrLink: d.locationOrLink !== undefined ? d.locationOrLink : existing.location_or_link,
      meetLink: d.meetLink !== undefined ? d.meetLink : existing.meet_link,
      lessonPlanId: d.lessonPlanId !== undefined ? d.lessonPlanId : existing.lesson_plan_id,
    };
    if (merged.endTime <= merged.startTime) {
      return NextResponse.json({ error: 'End time must be after start time.' }, { status: 400 });
    }

    await sql`
      UPDATE class_schedule SET
        subject = ${merged.subject},
        teacher_id = ${merged.teacherId},
        day_of_week = ${merged.dayOfWeek},
        start_time = ${merged.startTime}::time,
        end_time = ${merged.endTime}::time,
        format = ${merged.format},
        location_or_link = ${merged.locationOrLink},
        meet_link = ${merged.meetLink},
        lesson_plan_id = ${merged.lessonPlanId}
      WHERE id = ${id}
    `;

    const reschedule = fieldsTouched.some((f) => ['dayOfWeek', 'startTime', 'endTime', 'teacherId', 'format', 'locationOrLink', 'subject'].includes(f));
    await sql`
      INSERT INTO schedule_session_history (class_schedule_id, changed_by, change_type, old_value, new_value)
      VALUES (
        ${id}, ${staff.adminUserId}, ${reschedule ? 'reschedule' : 'content_update'},
        ${JSON.stringify(existing)}::jsonb, ${JSON.stringify(merged)}::jsonb
      )
    `;

    if (reschedule) {
      await regenerateScheduleOccurrences({ classScheduleId: id });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/class-schedule/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not update schedule entry.' }, { status: 500 });
  }
}

/** Removing a weekly slot entirely (not just cancelling one occurrence) is admin-only, same as
 * creating one. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid schedule entry id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const [existing] = (await sql`
      SELECT class_name, subject, teacher_id, day_of_week, start_time::text, end_time::text,
        format, location_or_link, meet_link, lesson_plan_id
      FROM class_schedule WHERE id = ${id}
    `) as unknown as ExistingRow[];
    if (!existing) {
      return NextResponse.json({ error: 'Schedule entry not found.' }, { status: 404 });
    }

    // Logged before the delete cascades: class_schedule_id is ON DELETE SET NULL on
    // schedule_session_history, so the row would otherwise lose its link right after being written.
    await sql`
      INSERT INTO schedule_session_history (class_schedule_id, changed_by, change_type, old_value, new_value)
      VALUES (${id}, ${staff.adminUserId}, 'deleted', ${JSON.stringify(existing)}::jsonb, NULL)
    `;
    await sql`DELETE FROM class_schedule WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/class-schedule/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete schedule entry.' }, { status: 500 });
  }
}
