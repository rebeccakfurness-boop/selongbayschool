import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enrolmentId = Number(id);
  if (!Number.isInteger(enrolmentId)) {
    return NextResponse.json({ error: 'Invalid enrolment id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const isRead = (body as { isRead?: unknown }).isRead;
  if (typeof isRead !== 'boolean') {
    return NextResponse.json({ error: 'isRead must be a boolean.' }, { status: 400 });
  }

  try {
    await sql`UPDATE enrolment_submissions SET is_read = ${isRead} WHERE id = ${enrolmentId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/enrolments/[id]] failed', err);
    return NextResponse.json({ error: 'Could not update enrolment.' }, { status: 500 });
  }
}
