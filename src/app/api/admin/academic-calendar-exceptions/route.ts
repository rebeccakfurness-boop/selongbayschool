import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { academicCalendarExceptionSchema } from '@/lib/validation';
import { regenerateScheduleOccurrences } from '@/lib/academic-calendar';

export async function POST(req: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = academicCalendarExceptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid exception.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const rows = await sql`
      INSERT INTO academic_calendar_exceptions (label, start_date, end_date, exception_type)
      VALUES (${d.label}, ${d.startDate}::date, ${d.endDate}::date, ${d.exceptionType})
      RETURNING id
    `;
    await regenerateScheduleOccurrences();
    return NextResponse.json({ id: rows[0].id });
  } catch (err) {
    console.error('[api/admin/academic-calendar-exceptions] failed to create', err);
    return NextResponse.json({ error: 'Could not create exception.' }, { status: 500 });
  }
}
