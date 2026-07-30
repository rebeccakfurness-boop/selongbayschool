import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { updateSchoolSettingsSchema } from '@/lib/validation';

export async function PATCH(req: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = updateSchoolSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid settings.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    await sql`
      UPDATE school_settings SET
        payable_to = COALESCE(${d.payableTo ?? null}, payable_to),
        bank_name = COALESCE(${d.bankName ?? null}, bank_name),
        account_number = COALESCE(${d.accountNumber ?? null}, account_number),
        account_name = COALESCE(${d.accountName ?? null}, account_name),
        swift_code = COALESCE(${d.swiftCode ?? null}, swift_code),
        bank_address = COALESCE(${d.bankAddress ?? null}, bank_address),
        bank_code = COALESCE(${d.bankCode ?? null}, bank_code),
        branch_code = COALESCE(${d.branchCode ?? null}, branch_code),
        clearing_code = COALESCE(${d.clearingCode ?? null}, clearing_code),
        currency = COALESCE(${d.currency ?? null}, currency),
        invoice_due_days = COALESCE(${d.invoiceDueDays ?? null}, invoice_due_days),
        updated_at = now()
      WHERE id = 1
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/school-settings] failed to update', err);
    return NextResponse.json({ error: 'Could not save settings.' }, { status: 500 });
  }
}
