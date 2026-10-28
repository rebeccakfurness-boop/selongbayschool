import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { upsertPartnerDiscountSchema } from '@/lib/validation';
import { getAllPartnerDiscounts, createPartnerDiscount } from '@/lib/family-discount';

/** Admin-only, like Parent Accounts/Enquiries -- this is a business-partnerships list, not
 * something a teacher needs to maintain. The parent-facing page reads the active subset straight
 * from getActivePartnerDiscounts in a server component instead of calling this. */
export async function GET() {
  await requireAdmin();
  try {
    await ensureSchema();
    const discounts = await getAllPartnerDiscounts();
    return NextResponse.json({ discounts });
  } catch (err) {
    console.error('[api/admin/partner-discounts] failed to load', err);
    return NextResponse.json({ error: 'Could not load the list.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const staff = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = upsertPartnerDiscountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid discount.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const id = await createPartnerDiscount(parsed.data, staff.adminUserId);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/admin/partner-discounts] failed to create', err);
    return NextResponse.json({ error: 'Could not save that discount.' }, { status: 500 });
  }
}
