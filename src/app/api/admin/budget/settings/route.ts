import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireBudgetUnlocked } from '@/lib/current-staff';
import { updateBudgetSettingsSchema } from '@/lib/validation';
import { updateBudgetSettings } from '@/lib/budget';

export async function PATCH(req: NextRequest) {
  try {
    await requireBudgetUnlocked();
  } catch (err) {
    if (err instanceof Error && err.message === 'BUDGET_LOCKED') {
      return NextResponse.json({ error: 'Budget Tracker is locked.' }, { status: 403 });
    }
    throw err;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = updateBudgetSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid settings.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await updateBudgetSettings(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/budget/settings] failed to update', err);
    return NextResponse.json({ error: 'Could not save settings.' }, { status: 500 });
  }
}
