import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { upsertSeranganCampaignSchema } from '@/lib/validation';
import { updateCampaign, deleteCampaign } from '@/lib/serangan';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid campaign id.' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = upsertSeranganCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid campaign.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await updateCampaign(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/serangan/campaigns/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not save that campaign.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid campaign id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await deleteCampaign(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/serangan/campaigns/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not remove that campaign.' }, { status: 500 });
  }
}
