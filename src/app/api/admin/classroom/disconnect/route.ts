import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';

export async function POST() {
  await requireAdmin();
  await ensureSchema();
  await sql`DELETE FROM classroom_connection WHERE id = 1`;
  return NextResponse.json({ ok: true });
}
