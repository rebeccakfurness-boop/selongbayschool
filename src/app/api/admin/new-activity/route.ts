import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get('since');
  const sinceDate = since ? new Date(since) : null;
  if (!sinceDate || Number.isNaN(sinceDate.getTime())) {
    return NextResponse.json({ error: 'Invalid or missing "since" timestamp.' }, { status: 400 });
  }

  try {
    await ensureSchema();

    const [bookingsRow] = (await sql`
      SELECT COUNT(*)::int AS count FROM bookings WHERE created_at > ${sinceDate.toISOString()} AND status != 'cancelled'
    `) as unknown as { count: number }[];

    const [enquiriesRow] = (await sql`
      SELECT COUNT(*)::int AS count FROM enquiries WHERE created_at > ${sinceDate.toISOString()}
    `) as unknown as { count: number }[];

    return NextResponse.json({ newBookings: bookingsRow.count, newEnquiries: enquiriesRow.count });
  } catch (err) {
    console.error('[api/admin/new-activity] failed', err);
    return NextResponse.json({ error: 'Could not check for new activity.' }, { status: 500 });
  }
}
