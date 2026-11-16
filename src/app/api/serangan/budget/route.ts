import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireSeranganAdminApi } from '@/lib/current-serangan';
import { upsertSeranganBudgetSchema } from '@/lib/validation';
import { getAllBudgets, upsertBudget } from '@/lib/serangan';

export async function GET() {
  try {
    await requireSeranganAdminApi();
  } catch {
    return NextResponse.json({ error: 'Not authorized to view the budget.' }, { status: 403 });
  }
  await ensureSchema();
  const budgets = await getAllBudgets();
  return NextResponse.json({ budgets });
}

export async function POST(req: NextRequest) {
  let staff;
  try {
    staff = await requireSeranganAdminApi();
  } catch {
    return NextResponse.json({ error: 'Not authorized to set the budget.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = upsertSeranganBudgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid budget.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await upsertBudget(parsed.data, staff.seranganAdminId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/serangan/budget] failed to save', err);
    return NextResponse.json({ error: 'Could not save that budget.' }, { status: 500 });
  }
}
