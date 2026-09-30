import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { createCcaOptionSchema } from '@/lib/validation';
import { addCcaOption } from '@/lib/cca';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const ccaId = Number(idParam);
  if (!Number.isInteger(ccaId)) {
    return NextResponse.json({ error: 'Invalid CCA id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = createCcaOptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid option.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const id = await addCcaOption(ccaId, parsed.data);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/admin/cca/activities/:id/options] failed to create', err);
    return NextResponse.json({ error: 'Could not add option.' }, { status: 500 });
  }
}
