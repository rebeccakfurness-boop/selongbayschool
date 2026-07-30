import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';

export async function GET(req: NextRequest) {
  await requireAdmin();
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ children: [] });
  }

  await ensureSchema();
  const rows = await sql`
    SELECT id, child_full_name, child_nickname, class_name
    FROM children
    WHERE child_full_name ILIKE ${`%${q}%`} OR child_nickname ILIKE ${`%${q}%`}
    ORDER BY child_full_name
    LIMIT 10
  `;
  return NextResponse.json({ children: rows });
}
