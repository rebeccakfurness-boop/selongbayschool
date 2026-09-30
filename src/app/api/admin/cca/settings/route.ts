import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { ccaSettingsSchema } from '@/lib/validation';
import { getCcaSettings, updateCcaSettings } from '@/lib/cca';

export const dynamic = 'force-dynamic';

export async function GET() {
  await requireAdmin();
  await ensureSchema();
  const settings = await getCcaSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = ccaSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid settings.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await updateCcaSettings(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/cca/settings] failed to save', err);
    return NextResponse.json({ error: 'Could not save settings.' }, { status: 500 });
  }
}
