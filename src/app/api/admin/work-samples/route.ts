import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { createWorkSampleSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = createWorkSampleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid work sample.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const children = await sql`SELECT class_name FROM children WHERE id = ${d.childId}`;
    if (children.length === 0) {
      return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, children[0].class_name as string))) {
      return NextResponse.json({ error: 'You are not assigned to this child’s class.' }, { status: 403 });
    }

    const rows = await sql`
      INSERT INTO work_samples (child_id, teacher_id, title, file_url)
      VALUES (${d.childId}, ${staff.adminUserId}, ${d.title}, ${d.fileUrl})
      RETURNING id
    `;
    return NextResponse.json({ id: rows[0].id });
  } catch (err) {
    console.error('[api/admin/work-samples] failed to create', err);
    return NextResponse.json({ error: 'Could not save work sample.' }, { status: 500 });
  }
}
