import { NextResponse } from 'next/server';
import { getCurrentStaff } from '@/lib/current-staff';
import { ensureSchema } from '@/lib/db';
import { getAttendanceEventSignature } from '@/lib/attendance';

/** Renders one attendance event's signature as a plain image response, so "View signature" can
 * just be a plain link opened in a new tab — no separate lightbox/viewer component needed. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; eventId: string }> }) {
  await getCurrentStaff();
  const { id: idParam, eventId: eventIdParam } = await params;
  const childId = Number(idParam);
  const eventId = Number(eventIdParam);
  if (!Number.isInteger(childId) || !Number.isInteger(eventId)) {
    return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const result = await getAttendanceEventSignature(eventId, childId);
    if (!result?.signatureDataUrl) {
      return NextResponse.json({ error: 'No signature on file for this entry.' }, { status: 404 });
    }

    const match = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(result.signatureDataUrl);
    if (!match) {
      return NextResponse.json({ error: 'Signature data is invalid.' }, { status: 500 });
    }
    const [, contentType, base64] = match;
    const bytes = Buffer.from(base64, 'base64');
    return new NextResponse(bytes, { status: 200, headers: { 'Content-Type': contentType } });
  } catch (err) {
    console.error('[api/admin/children/:id/attendance/:eventId/signature] failed', err);
    return NextResponse.json({ error: 'Could not load signature.' }, { status: 500 });
  }
}
