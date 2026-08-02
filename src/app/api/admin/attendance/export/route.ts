import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getAttendanceReport, attendanceReportToCsv } from '@/lib/attendance';

export async function GET(req: NextRequest) {
  await requireAdmin();

  const { searchParams } = req.nextUrl;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const classFilter = searchParams.get('class');
  const childIdParam = searchParams.get('childId');
  if (!from || !to) {
    return NextResponse.json({ error: 'from and to dates are required.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = await getAttendanceReport({
      from,
      to,
      classFilter: classFilter || null,
      childId: childIdParam ? Number(childIdParam) : null,
    });
    const csv = attendanceReportToCsv(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="attendance-${from}-to-${to}.csv"`,
      },
    });
  } catch (err) {
    console.error('[api/admin/attendance/export] failed', err);
    return NextResponse.json({ error: 'Could not export attendance.' }, { status: 500 });
  }
}
