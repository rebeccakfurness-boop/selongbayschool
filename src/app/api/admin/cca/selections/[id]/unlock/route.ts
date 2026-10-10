import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { unlockCcaSelection } from '@/lib/cca';

/** Deletes a submitted (not yet invoiced) CCA selection so the parent portal shows it as unsubmitted
 * again -- the admin-side half of "contact the school office to change your selection" on the
 * parent form. See unlockCcaSelection's own comment for why this is a delete, not a status flip. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const selectionId = Number(idParam);
  if (!Number.isInteger(selectionId)) {
    return NextResponse.json({ error: 'Invalid selection id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const result = await unlockCcaSelection(selectionId);
    if (!result.ok) {
      const message = result.reason === 'invoiced' ? 'This selection has already been invoiced and can’t be unlocked.' : 'Selection not found.';
      return NextResponse.json({ error: message }, { status: result.reason === 'invoiced' ? 409 : 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/cca/selections/:id/unlock] failed', err);
    return NextResponse.json({ error: 'Could not unlock that selection.' }, { status: 500 });
  }
}
