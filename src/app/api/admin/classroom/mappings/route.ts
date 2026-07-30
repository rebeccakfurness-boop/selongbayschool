import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { z } from 'zod';

const mappingSchema = z.object({
  googleCourseId: z.string().trim().min(1),
  googleCourseName: z.string().trim().min(1),
  className: z.string().trim().min(1),
});

export async function POST(req: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = mappingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid mapping.' }, { status: 400 });
  }
  const { googleCourseId, googleCourseName, className } = parsed.data;

  try {
    await ensureSchema();
    await sql`
      INSERT INTO classroom_course_mappings (google_course_id, google_course_name, class_name)
      VALUES (${googleCourseId}, ${googleCourseName}, ${className})
      ON CONFLICT (google_course_id) DO UPDATE SET google_course_name = EXCLUDED.google_course_name, class_name = EXCLUDED.class_name
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/classroom/mappings] failed to save', err);
    return NextResponse.json({ error: 'Could not save mapping.' }, { status: 500 });
  }
}
