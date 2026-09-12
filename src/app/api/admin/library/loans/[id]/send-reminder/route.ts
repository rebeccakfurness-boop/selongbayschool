import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/current-staff';
import { sendDueSoonReminderForLoan, DueSoonReminderError } from '@/lib/library';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const loanId = Number(id);
  if (!Number.isInteger(loanId)) {
    return NextResponse.json({ error: 'Invalid loan id.' }, { status: 400 });
  }

  try {
    await sendDueSoonReminderForLoan(loanId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof DueSoonReminderError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('[api/admin/library/loans/:id/send-reminder] failed', err);
    return NextResponse.json({ error: 'Could not send this reminder.' }, { status: 500 });
  }
}
