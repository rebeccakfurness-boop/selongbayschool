import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getTermCalendarDays, getStudentTermRegister, getStaffTermRegister, buildTermAttendanceWorkbook } from '@/lib/term-attendance-report';

/** Downloads one workbook covering the whole school for a term -- Students and Staff each get
 * their own sheet, both checked against the same academic calendar (see term-attendance-report.ts
 * for how a "school day" is decided), so a day the school was closed for a holiday reads as that
 * holiday's own name rather than a blank or a false "Absent". */
export async function GET(req: NextRequest) {
  await requireAdmin();

  const termIdParam = req.nextUrl.searchParams.get('termId');
  const classFilter = req.nextUrl.searchParams.get('class');
  const termId = Number(termIdParam);
  if (!Number.isInteger(termId)) {
    return NextResponse.json({ error: 'A valid termId is required.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const { term, days } = await getTermCalendarDays(termId);
    const [studentRegister, staffRegister] = await Promise.all([
      getStudentTermRegister(term.start_date, term.end_date, classFilter || null),
      getStaffTermRegister(term.start_date, term.end_date),
    ]);
    const buffer = buildTermAttendanceWorkbook(days, studentRegister, staffRegister);
    const safeLabel = term.label.trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase() || `term-${term.id}`;

    return new NextResponse(
      // TypeScript's BodyInit wants a concrete Uint8Array<ArrayBuffer>; SheetJS's own typings
      // return the more general Uint8Array<ArrayBufferLike> -- a real Uint8Array either way, so
      // this is a type-system nuisance, not a runtime one.
      buffer as BodyInit,
      {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="attendance-register-${safeLabel}.xlsx"`,
        },
      }
    );
  } catch (err) {
    console.error('[api/admin/attendance/term-report] failed', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not build the attendance register.' }, { status: 500 });
  }
}
