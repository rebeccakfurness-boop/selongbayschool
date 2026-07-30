import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { z } from 'zod';

const bodySchema = z.object({ className: z.string().trim().min(1).max(100) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const adminUserId = Number(idParam);
  if (!Number.isInteger(adminUserId)) {
    return NextResponse.json({ error: 'Invalid staff id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid class name.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await sql`
      INSERT INTO teacher_assignments (admin_user_id, class_name) VALUES (${adminUserId}, ${parsed.data.className})
      ON CONFLICT (admin_user_id, class_name) DO NOTHING
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/staff/:id/assignments] failed to add', err);
    return NextResponse.json({ error: 'Could not add assignment.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const adminUserId = Number(idParam);
  if (!Number.isInteger(adminUserId)) {
    return NextResponse.json({ error: 'Invalid staff id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid class name.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await sql`DELETE FROM teacher_assignments WHERE admin_user_id = ${adminUserId} AND class_name = ${parsed.data.className}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/staff/:id/assignments] failed to remove', err);
    return NextResponse.json({ error: 'Could not remove assignment.' }, { status: 500 });
  }
}
