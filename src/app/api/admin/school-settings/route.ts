import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { updateSchoolSettingsSchema } from '@/lib/validation';

/** Just the one field the Activities & Calendar admin page needs (it's a client component that
 * fetches its own data, unlike the Settings page which reads school_settings server-side) --
 * deliberately not the whole row, since that also holds the school's bank account details. */
export async function GET() {
  await requireAdmin();
  await ensureSchema();
  const [row] = (await sql`SELECT academic_calendar_pdf_url FROM school_settings WHERE id = 1`) as unknown as {
    academic_calendar_pdf_url: string | null;
  }[];
  return NextResponse.json({ academicCalendarPdfUrl: row?.academic_calendar_pdf_url ?? null });
}

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
        academic_calendar_pdf_url = COALESCE(${d.academicCalendarPdfUrl ?? null}, academic_calendar_pdf_url),
        updated_at = now()
      WHERE id = 1
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/school-settings] failed to update', err);
    return NextResponse.json({ error: 'Could not save settings.' }, { status: 500 });
  }
}
