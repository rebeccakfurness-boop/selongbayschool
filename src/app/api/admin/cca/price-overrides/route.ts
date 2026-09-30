import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { setCcaPriceOverrideSchema } from '@/lib/validation';
import { setCcaPriceOverride } from '@/lib/cca';

export async function POST(req: NextRequest) {
  const staff = await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = setCcaPriceOverrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid override.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await setCcaPriceOverride(parsed.data, staff.adminUserId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/cca/price-overrides] failed to save', err);
    return NextResponse.json({ error: 'Could not save override.' }, { status: 500 });
  }
}
