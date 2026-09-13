import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getStaffAttendanceReport, staffAttendanceReportToCsv } from '@/lib/staff-attendance';

export async function GET(req: NextRequest) {
  await requireAdmin();

  const { searchParams } = req.nextUrl;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const adminUserIdParam = searchParams.get('adminUserId');
  if (!from || !to) {
    return NextResponse.json({ error: 'from and to dates are required.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = await getStaffAttendanceReport({
      from,
      to,
      adminUserId: adminUserIdParam ? Number(adminUserIdParam) : null,
    });
    const csv = staffAttendanceReportToCsv(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="staff-attendance-${from}-to-${to}.csv"`,
      },
    });
  } catch (err) {
    console.error('[api/admin/staff-attendance/export] failed', err);
    return NextResponse.json({ error: 'Could not export attendance.' }, { status: 500 });
  }
}
