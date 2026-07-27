import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { createPhotoFeedItemSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = createPhotoFeedItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid photo.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();

    if (d.className && !(await canAccessClass(staff, d.className))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }
    if (d.childIds.length > 0) {
      const tagged = await sql`SELECT id, class_name FROM children WHERE id = ANY(${d.childIds})`;
      for (const row of tagged as unknown as { id: number; class_name: string | null }[]) {
        if (!(await canAccessClass(staff, row.class_name))) {
          return NextResponse.json({ error: 'You are not assigned to one of the tagged children’s classes.' }, { status: 403 });
        }
      }
    }

    const rows = await sql`
      INSERT INTO photo_feed_items (uploaded_by, file_url, caption, class_name)
      VALUES (${staff.adminUserId}, ${d.fileUrl}, ${d.caption ?? null}, ${d.className ?? null})
      RETURNING id
    `;
    const photoId = rows[0].id as number;
    for (const childId of d.childIds) {
      await sql`INSERT INTO photo_feed_tags (photo_id, child_id) VALUES (${photoId}, ${childId})`;
    }
    return NextResponse.json({ id: photoId });
  } catch (err) {
    console.error('[api/admin/photo-feed] failed to create', err);
    return NextResponse.json({ error: 'Could not save photo.' }, { status: 500 });
  }
}
