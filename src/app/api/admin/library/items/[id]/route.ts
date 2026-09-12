import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';

const ITEM_TYPES = ['book', 'toy', 'sports_equipment'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) {
    return NextResponse.json({ error: 'Invalid item id.' }, { status: 400 });
  }

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
    isActive?: boolean;
  };

  if (d.itemType && !ITEM_TYPES.includes(d.itemType)) {
    return NextResponse.json({ error: 'Invalid item type.' }, { status: 400 });
  }
  if (d.title !== undefined && !d.title.trim()) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }

  try {
    const rows = await sql`
      UPDATE library_items SET
        item_type = COALESCE(${d.itemType ?? null}, item_type),
        title = COALESCE(${d.title?.trim() ?? null}, title),
        author = COALESCE(${d.author?.trim() || null}, author),
        category = COALESCE(${d.category?.trim() || null}, category),
        item_code = COALESCE(${d.itemCode?.trim() || null}, item_code),
        description = COALESCE(${d.description?.trim() || null}, description),
        photo_url = COALESCE(${d.photoUrl?.trim() || null}, photo_url),
        total_copies = COALESCE(${d.totalCopies ?? null}, total_copies),
        is_active = COALESCE(${d.isActive ?? null}, is_active)
      WHERE id = ${itemId}
      RETURNING id
    `;
    if (rows.length === 0) return NextResponse.json({ error: 'Item not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/library/items/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not update item.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) {
    return NextResponse.json({ error: 'Invalid item id.' }, { status: 400 });
  }

  try {
    const [{ count }] = (await sql`
      SELECT count(*)::int FROM library_loans WHERE item_id = ${itemId} AND returned_at IS NULL
    `) as unknown as { count: number }[];
    if (count > 0) {
      return NextResponse.json({ error: 'This item has copies out on loan — return them before removing it.' }, { status: 400 });
    }
    await sql`DELETE FROM library_items WHERE id = ${itemId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/library/items/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete item.' }, { status: 500 });
  }
}
