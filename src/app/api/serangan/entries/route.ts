import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentSeranganAdmin } from '@/lib/current-serangan';
import { upsertSeranganEntrySchema } from '@/lib/validation';
import { getRecentEntries, createEntry } from '@/lib/serangan';

export async function GET() {
  await ensureSchema();
  const entries = await getRecentEntries(200);
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const staff = await getCurrentSeranganAdmin();
  const body = await req.json().catch(() => null);
  const parsed = upsertSeranganEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid entry.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const id = await createEntry(parsed.data, staff.seranganAdminId);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/serangan/entries] failed to create', err);
    return NextResponse.json({ error: 'Could not save that entry.' }, { status: 500 });
  }
}
