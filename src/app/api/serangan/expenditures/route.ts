import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentSeranganAdmin } from '@/lib/current-serangan';
import { upsertSeranganExpenditureSchema } from '@/lib/validation';
import { getRecentExpenditures, createExpenditure } from '@/lib/serangan';

export async function GET() {
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
