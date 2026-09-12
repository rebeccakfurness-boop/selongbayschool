import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { createStudentAccount, getStudentAccountForChild } from '@/lib/student-accounts';

/** Student login accounts stay admin-only to create, same boundary as the general Child Card edit
 * (PATCH /api/admin/children/:id) -- this is account/credential management, not curriculum, so it
 * doesn't follow the teacher-accessible canAccessClass pattern the Online Learning section uses. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  if (staff.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can manage student logins.' }, { status: 403 });
  }

  const { id: idParam } = await params;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) {
    return NextResponse.json({ error: 'Invalid child id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const account = await getStudentAccountForChild(childId);
    return NextResponse.json({ account });
  } catch (err) {
    console.error('[api/admin/children/:id/student-account] failed to load', err);
    return NextResponse.json({ error: 'Could not load this student login.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  if (staff.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can manage student logins.' }, { status: 403 });
  }

  const { id: idParam } = await params;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) {
    return NextResponse.json({ error: 'Invalid child id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const username = (body as { username?: unknown })?.username;
  if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 100) {
    return NextResponse.json({ error: 'Username must be at least 3 characters.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const [child] = (await sql`SELECT id FROM children WHERE id = ${childId}`) as unknown as { id: number }[];
    if (!child) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });

    const result = await createStudentAccount(childId, username.trim());
    if (!result.ok) {
      const message = result.error === 'already_exists' ? 'This student already has a login.' : 'That username is already taken.';
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ ok: true, tempPassword: result.tempPassword });
  } catch (err) {
    console.error('[api/admin/children/:id/student-account] failed to create', err);
    return NextResponse.json({ error: 'Could not create a student login.' }, { status: 500 });
  }
}
