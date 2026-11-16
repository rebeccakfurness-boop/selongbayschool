import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentSeranganAdmin, requireSeranganAdminApi } from '@/lib/current-serangan';
import { upsertSeranganExpenditureSchema } from '@/lib/validation';
import { getRecentExpenditures, createExpenditure } from '@/lib/serangan';

// Listing/totals are the "transactions" a 'staff' account must never see -- but POST below stays
// open to both roles, since logging a new expense is explicitly allowed for 'staff'.
export async function GET() {
  try {
    await requireSeranganAdminApi();
  } catch {
    return NextResponse.json({ error: 'Not authorized to view expenditures.' }, { status: 403 });
  }
  await ensureSchema();
  const expenditures = await getRecentExpenditures(200);
  return NextResponse.json({ expenditures });
}

export async function POST(req: NextRequest) {
  const staff = await getCurrentSeranganAdmin();
  const body = await req.json().catch(() => null);
  const parsed = upsertSeranganExpenditureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid expenditure.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const id = await createExpenditure(parsed.data, staff.seranganAdminId);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/serangan/expenditures] failed to create', err);
    return NextResponse.json({ error: 'Could not save that expenditure.' }, { status: 500 });
  }
}
