import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentSeranganAdmin } from '@/lib/current-serangan';
import { importSeranganStatementSchema } from '@/lib/validation';
import { createDonation, createExpenditure } from '@/lib/serangan';

/** Commits the rows a human has already reviewed and confirmed in SeranganStatementImportReview
 * -- each row is just an ordinary donation or expenditure at this point, so this writes through
 * the same createDonation/createExpenditure functions the manual entry forms use, rather than a
 * separate bulk-insert path. */
export async function POST(req: NextRequest) {
  const staff = await getCurrentSeranganAdmin();
  const body = await req.json().catch(() => null);
  const parsed = importSeranganStatementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
  }
  if (parsed.data.donations.length === 0 && parsed.data.expenditures.length === 0) {
    return NextResponse.json({ error: 'Nothing to import -- every row was marked Skip.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    for (const donation of parsed.data.donations) {
      await createDonation(donation, staff.seranganAdminId);
    }
    for (const expenditure of parsed.data.expenditures) {
      await createExpenditure(expenditure, staff.seranganAdminId);
    }
    return NextResponse.json({
      donationsImported: parsed.data.donations.length,
      expendituresImported: parsed.data.expenditures.length,
    });
  } catch (err) {
    console.error('[api/serangan/statements/import] failed', err);
    return NextResponse.json({ error: 'Could not import these transactions.' }, { status: 500 });
  }
}
