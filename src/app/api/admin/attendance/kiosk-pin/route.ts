import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { setKioskPinSchema } from '@/lib/validation';

export async function PATCH(req: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = setKioskPinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid PIN.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const pinHash = await bcrypt.hash(parsed.data.pin, 10);
    await sql`UPDATE kiosk_settings SET pin_hash = ${pinHash}, updated_at = now() WHERE id = 1`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/attendance/kiosk-pin] failed to save', err);
    return NextResponse.json({ error: 'Could not save the PIN.' }, { status: 500 });
  }
}
