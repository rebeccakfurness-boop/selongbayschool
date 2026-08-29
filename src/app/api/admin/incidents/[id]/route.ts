import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { updateIncidentReportSchema } from '@/lib/validation';
import { updateIncidentReport } from '@/lib/incident-reports';

/** Admin-only, same as parent feedback -- teachers file reports through the POST route but the
 * office triages status/notes and marks things read. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid incident id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = updateIncidentReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await updateIncidentReport(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/incidents/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not save changes.' }, { status: 500 });
  }
}
