import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';

const ITEM_TYPES = ['book', 'toy', 'sports_equipment'];

export async function POST(req: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const d = body as {
    itemType?: string;
    title?: string;
    author?: string;
    category?: string;
    itemCode?: string;
    description?: string;
    photoUrl?: string;
    totalCopies?: number;
  };

  if (!d.itemType || !ITEM_TYPES.includes(d.itemType)) {
    return NextResponse.json({ error: 'Invalid item type.' }, { status: 400 });
  }
  if (!d.title || !d.title.trim()) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }
  const totalCopies = Number(d.totalCopies ?? 1);
  if (!Number.isInteger(totalCopies) || totalCopies < 1) {
    return NextResponse.json({ error: 'Total copies must be a whole number of at least 1.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = await sql`
      INSERT INTO library_items (item_type, title, author, category, item_code, description, photo_url, total_copies)
      VALUES (
        ${d.itemType}, ${d.title.trim()}, ${d.author?.trim() || null}, ${d.category?.trim() || null},
        ${d.itemCode?.trim() || null}, ${d.description?.trim() || null}, ${d.photoUrl?.trim() || null}, ${totalCopies}
      )
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error('[api/admin/library/items] failed to create', err);
    return NextResponse.json({ error: 'Could not create item.' }, { status: 500 });
  }
}
