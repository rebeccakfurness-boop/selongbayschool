import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { createCreditNoteSchema } from '@/lib/validation';
import { createCreditNote } from '@/lib/credit-notes';

export async function POST(req: NextRequest) {
  const staff = await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = createCreditNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid credit note.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const { id, creditNoteNumber } = await createCreditNote(parsed.data, staff.adminUserId);
    return NextResponse.json({ id, creditNoteNumber });
  } catch (err) {
    console.error('[api/admin/credit-notes] failed to create', err);
    return NextResponse.json({ error: 'Could not create credit note.' }, { status: 500 });
  }
}
