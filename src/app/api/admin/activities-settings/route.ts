import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { updateActivitiesSettingsSchema } from '@/lib/validation';

export async function GET() {
  await requireAdmin();
  await ensureSchema();
  const [row] = (await sql`SELECT bookings_open, closed_message FROM activities_settings WHERE id = 1`) as unknown as {
    bookings_open: boolean;
    closed_message: string | null;
  }[];
  return NextResponse.json({ bookingsOpen: row?.bookings_open ?? true, closedMessage: row?.closed_message ?? null });
}

export async function PATCH(req: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = updateActivitiesSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid settings.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    await sql`
      UPDATE activities_settings SET
        bookings_open = COALESCE(${d.bookingsOpen ?? null}, bookings_open),
        closed_message = CASE WHEN ${d.closedMessage !== undefined} THEN ${d.closedMessage ?? null} ELSE closed_message END,
        updated_at = now()
      WHERE id = 1
    `;
    // Without this, the public Activities page's cached read of this setting (60s TTL) could
    // keep showing the old open/closed state for up to a minute after admin saves here.
    // { expire: 0 } is Next 16's way of saying "purge immediately" -- revalidateTag(tag) alone
    // is deprecated as of this version and only warns rather than actually doing nothing.
    revalidateTag('activities-bookings-settings', { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/activities-settings] failed to update', err);
    return NextResponse.json({ error: 'Could not save settings.' }, { status: 500 });
  }
}
