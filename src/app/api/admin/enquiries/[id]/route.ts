import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enquiryId = Number(id);
  if (!Number.isInteger(enquiryId)) {
    return NextResponse.json({ error: 'Invalid enquiry id.' }, { status: 400 });
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
    await sql`UPDATE enquiries SET is_read = ${isRead} WHERE id = ${enquiryId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/enquiries/[id]] failed', err);
    return NextResponse.json({ error: 'Could not update enquiry.' }, { status: 500 });
  }
}
