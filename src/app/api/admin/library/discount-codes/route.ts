import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';

export async function POST(req: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const d = body as { code?: string; description?: string; discountPercent?: number; maxRedemptions?: number | null; expiresAt?: string | null };
  const code = d.code?.trim().toUpperCase();
  const discountPercent = Number(d.discountPercent);
  if (!code) return NextResponse.json({ error: 'A code is required.' }, { status: 400 });
  if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
    return NextResponse.json({ error: 'Discount must be between 1 and 100%.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = await sql`
      INSERT INTO library_discount_codes (code, description, discount_percent, max_redemptions, expires_at)
      VALUES (${code}, ${d.description?.trim() || null}, ${discountPercent}, ${d.maxRedemptions || null}, ${d.expiresAt || null})
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    if (err instanceof Error && err.message.includes('duplicate key')) {
      return NextResponse.json({ error: 'That code already exists.' }, { status: 400 });
    }
    console.error('[api/admin/library/discount-codes] failed to create', err);
    return NextResponse.json({ error: 'Could not create code.' }, { status: 500 });
  }
}
