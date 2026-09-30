import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { createCcaInvoiceForSelection } from '@/lib/cca';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const selectionId = Number(idParam);
  if (!Number.isInteger(selectionId)) {
    return NextResponse.json({ error: 'Invalid selection id.' }, { status: 400 });
  }

  try {
    await ensureSchema();

    const rows = await sql`
      SELECT c.parent1_name, c.parent2_name
      FROM cca_selections cs JOIN children c ON c.id = cs.child_id
      WHERE cs.id = ${selectionId}
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Selection not found.' }, { status: 404 });
    }
    const billedToName = [rows[0].parent1_name, rows[0].parent2_name].filter(Boolean).join(' and ') || 'Parent/Guardian';

    const [settings] = await sql`SELECT invoice_due_days FROM school_settings WHERE id = 1`;
    const dueDays = (settings?.invoice_due_days as number) ?? 5;

    const result = await createCcaInvoiceForSelection(selectionId, billedToName, dueDays);
    if ('error' in result) {
      const message = result.error === 'already_invoiced' ? 'This selection has already been invoiced.' : 'Every item is excluded -- nothing to invoice.';
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/admin/cca/selections/:id/create-invoice] failed', err);
    return NextResponse.json({ error: 'Could not create invoice.' }, { status: 500 });
  }
}
