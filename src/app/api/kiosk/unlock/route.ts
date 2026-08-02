import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import bcrypt from 'bcryptjs';
import { ensureSchema, sql } from '@/lib/db';
import { getKioskSessionOptions, type KioskSessionData } from '@/lib/auth';
import { kioskUnlockSchema } from '@/lib/validation';

/** Not covered by proxy.ts's kiosk gate (that's exactly what this route exists to grant), so this
 * is the one /api/kiosk/* endpoint that's publicly reachable — see PUBLIC_KIOSK_API_PATHS. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = kioskUnlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Enter the kiosk PIN.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const [settings] = (await sql`SELECT pin_hash FROM kiosk_settings WHERE id = 1`) as unknown as { pin_hash: string | null }[];
    if (!settings?.pin_hash) {
      return NextResponse.json({ error: 'Kiosk PIN has not been set up yet — ask the school office.' }, { status: 409 });
    }

    const valid = await bcrypt.compare(parsed.data.pin, settings.pin_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 401 });
    }

    const session = await getIronSession<KioskSessionData>(await cookies(), await getKioskSessionOptions());
    session.unlocked = true;
    await session.save();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/kiosk/unlock] failed', err);
    return NextResponse.json({ error: 'Could not unlock the kiosk right now.' }, { status: 500 });
  }
}
