import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { checkoutLibraryItem, getLibrarySettings } from '@/lib/library';

export async function POST(req: NextRequest) {
  const staff = await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const d = body as { itemId?: number; childId?: number; dueDate?: string; notes?: string };
  const itemId = Number(d.itemId);
  const childId = Number(d.childId);
  if (!Number.isInteger(itemId) || !Number.isInteger(childId)) {
    return NextResponse.json({ error: 'An item and a child are required.' }, { status: 400 });
  }

  try {
    await ensureSchema();

    const [item] = (await sql`
      SELECT total_copies, is_active, school_only,
        (SELECT count(*) FROM library_loans WHERE item_id = ${itemId} AND returned_at IS NULL) AS copies_out,
        (SELECT count(*) FROM library_reservations WHERE item_id = ${itemId} AND status = 'pending_pickup') AS copies_held
      FROM library_items WHERE id = ${itemId}
    `) as unknown as { total_copies: number; is_active: boolean; school_only: boolean; copies_out: number; copies_held: number }[];
    if (!item) return NextResponse.json({ error: 'Item not found.' }, { status: 404 });
    if (!item.is_active) return NextResponse.json({ error: 'This item is no longer active in the catalogue.' }, { status: 400 });
    if (item.school_only) return NextResponse.json({ error: 'This item is for school use only and cannot be checked out to take home.' }, { status: 400 });
    if (item.copies_out + item.copies_held >= item.total_copies) {
      return NextResponse.json({ error: 'No copies of this item are currently available — the rest are on loan or held for a reservation.' }, { status: 400 });
    }

    let dueDate = d.dueDate;
    if (!dueDate) {
      const settings = await getLibrarySettings();
      const [{ due }] = (await sql`SELECT (CURRENT_DATE + (${settings.default_loan_period_days} || ' days')::interval)::date::text AS due`) as unknown as {
        due: string;
      }[];
      dueDate = due;
    }

    const loanId = await checkoutLibraryItem({ itemId, childId, dueDate, checkedOutBy: staff.adminUserId, notes: d.notes?.trim() || null });
    return NextResponse.json({ ok: true, id: loanId });
  } catch (err) {
    console.error('[api/admin/library/loans] failed to check out', err);
    return NextResponse.json({ error: 'Could not check out this item.' }, { status: 500 });
  }
}
