import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentSeranganAdmin } from '@/lib/current-serangan';
import { upsertSeranganCampaignSchema } from '@/lib/validation';
import { getAllCampaigns, createCampaign } from '@/lib/serangan';

export async function GET() {
  await ensureSchema();
  const campaigns = await getAllCampaigns();
  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const staff = await getCurrentSeranganAdmin();
  const body = await req.json().catch(() => null);
  const parsed = upsertSeranganCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid campaign.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const id = await createCampaign(parsed.data, staff.seranganAdminId);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/serangan/campaigns] failed to create', err);
    return NextResponse.json({ error: 'Could not save that campaign.' }, { status: 500 });
  }
}
