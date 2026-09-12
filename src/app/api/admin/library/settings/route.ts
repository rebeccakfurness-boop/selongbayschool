import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';

export async function PATCH(req: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const d = body as {
    monthlyMembershipFeeIdr?: number;
    defaultLoanPeriodDays?: number;
    lateFeePerDayIdr?: number;
    lateFeeCapIdr?: number | null;
    invoiceDueDays?: number;
  };

  const monthlyFee = Number(d.monthlyMembershipFeeIdr);
  const loanDays = Number(d.defaultLoanPeriodDays);
  const lateFee = Number(d.lateFeePerDayIdr);
  const dueDays = Number(d.invoiceDueDays);
  if (![monthlyFee, loanDays, lateFee, dueDays].every((n) => Number.isFinite(n) && n >= 0)) {
    return NextResponse.json({ error: 'All amounts must be zero or more.' }, { status: 400 });
  }

  try {
    await sql`
      UPDATE library_settings SET
        monthly_membership_fee_idr = ${monthlyFee},
        default_loan_period_days = ${loanDays},
        late_fee_per_day_idr = ${lateFee},
        late_fee_cap_idr = ${d.lateFeeCapIdr || null},
        invoice_due_days = ${dueDays}
      WHERE id = 1
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/library/settings] failed', err);
    return NextResponse.json({ error: 'Could not save settings.' }, { status: 500 });
  }
}
