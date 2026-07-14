import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureSchema();
    const rows = await sql`
      SELECT id, slug, name FROM activities ORDER BY id ASC
    `;
    return NextResponse.json({ activities: rows });
  } catch (err) {
    console.error('[api/admin/activities] failed to load activities', err);
    return NextResponse.json({ error: 'Could not load activities.' }, { status: 500 });
  }
}
