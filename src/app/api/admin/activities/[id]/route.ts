import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { updateActivitySchema } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid activity id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = updateActivitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }
  const { name, day, duration, priceIDR, defaultTime, defaultCapacity, isActive, photoUrl } = parsed.data;

  try {
    await ensureSchema();
    const rows = await sql`
      UPDATE activities
      SET
        name = COALESCE(${name ?? null}, name),
        day = COALESCE(${day ?? null}, day),
        duration = COALESCE(${duration ?? null}, duration),
        price_idr = CASE WHEN ${priceIDR === undefined} THEN price_idr ELSE ${priceIDR ?? null} END,
        default_time = COALESCE(${defaultTime ?? null}, default_time),
        default_capacity = COALESCE(${defaultCapacity ?? null}, default_capacity),
        is_active = COALESCE(${isActive ?? null}, is_active),
        photo_url = COALESCE(${photoUrl ?? null}, photo_url)
      WHERE id = ${id}
      RETURNING id, slug, name, day, duration, price_idr, price_note, default_time, default_capacity, is_active, photo_url
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Activity not found.' }, { status: 404 });
    }
    return NextResponse.json({ activity: rows[0] });
  } catch (err) {
    console.error('[api/admin/activities/:id] failed to update activity', err);
    return NextResponse.json({ error: 'Could not update activity.' }, { status: 500 });
  }
}
