import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { updateBookingStatusSchema } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const passId = Number(id);
  if (!Number.isInteger(passId)) {
    return NextResponse.json({ error: 'Invalid pass id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = updateBookingStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid status.' }, { status: 400 });
  }

  try {
    const rows = await sql`
      UPDATE passes SET status = ${parsed.data.status}
      WHERE id = ${passId} AND status = 'pending_payment'
      RETURNING id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Pass not found or not awaiting payment.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/passes/[id]] failed', err);
    return NextResponse.json({ error: 'Could not update pass.' }, { status: 500 });
  }
}
