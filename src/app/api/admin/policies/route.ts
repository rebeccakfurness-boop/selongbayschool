import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { createSchoolPolicySchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = createSchoolPolicySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid policy.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const rows = await sql`
      INSERT INTO school_policies (title, description, file_url, sort_order, uploaded_by)
      VALUES (${d.title}, ${d.description ?? null}, ${d.fileUrl}, ${d.sortOrder ?? 0}, ${staff.adminUserId})
      RETURNING id
    `;
    return NextResponse.json({ id: rows[0].id });
  } catch (err) {
    console.error('[api/admin/policies] failed to create', err);
    return NextResponse.json({ error: 'Could not save policy.' }, { status: 500 });
  }
}
