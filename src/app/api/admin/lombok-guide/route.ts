import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { upsertLombokGuideEntrySchema } from '@/lib/validation';
import { getAllGuideEntries, createGuideEntry } from '@/lib/lombok-guide';

/** Admin-only to curate (this is school-vetted local advice, not something a teacher maintains).
 * The parent-facing page reads the active subset straight from getActiveGuideEntries in a server
 * component instead of calling this. */
export async function GET() {
  await requireAdmin();
  try {
    await ensureSchema();
    const entries = await getAllGuideEntries();
    return NextResponse.json({ entries });
  } catch (err) {
    console.error('[api/admin/lombok-guide] failed to load', err);
    return NextResponse.json({ error: 'Could not load the guide.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const staff = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = upsertLombokGuideEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid entry.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const id = await createGuideEntry(parsed.data, staff.adminUserId);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/admin/lombok-guide] failed to create', err);
    return NextResponse.json({ error: 'Could not save that entry.' }, { status: 500 });
  }
}
