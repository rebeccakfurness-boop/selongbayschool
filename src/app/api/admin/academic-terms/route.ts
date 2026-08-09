import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { academicTermSchema } from '@/lib/validation';
import { regenerateScheduleOccurrences } from '@/lib/academic-calendar';

/** Admin-only: term dates are the foundation everything else in the Weekly Schedule generates
 * against, so getting them right (and being able to correct them) matters more than who's allowed
 * to touch them being flexible. */
export async function POST(req: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = academicTermSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid term.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const rows = await sql`
      INSERT INTO academic_terms (label, start_date, end_date)
      VALUES (${d.label}, ${d.startDate}::date, ${d.endDate}::date)
      RETURNING id
    `;
    await regenerateScheduleOccurrences();
    return NextResponse.json({ id: rows[0].id });
  } catch (err) {
    console.error('[api/admin/academic-terms] failed to create', err);
    return NextResponse.json({ error: 'Could not create term.' }, { status: 500 });
  }
}
