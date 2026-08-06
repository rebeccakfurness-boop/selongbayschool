import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { createChildSchema, firstIssueMessage } from '@/lib/validation';
import { createChild } from '@/lib/child-lifecycle';

/** Creates a child card directly (for a family who isn't in the imported spreadsheet, or wasn't
 * captured there) — the counterpart to PATCH /api/admin/children/:id, which only ever updates an
 * existing row. */
export async function POST(req: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = createChildSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error, 'Invalid child.') }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const id = await createChild(d);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/admin/children] failed to create', err);
    return NextResponse.json({ error: 'Could not create child record.' }, { status: 500 });
  }
}
