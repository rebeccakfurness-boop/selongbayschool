import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentSeranganAdmin } from '@/lib/current-serangan';
import { upsertSeranganDonationSchema } from '@/lib/validation';
import { getRecentDonations, createDonation } from '@/lib/serangan';

export async function GET() {
  await ensureSchema();
  const donations = await getRecentDonations(200);
  return NextResponse.json({ donations });
}

export async function POST(req: NextRequest) {
  const staff = await getCurrentSeranganAdmin();
  const body = await req.json().catch(() => null);
  const parsed = upsertSeranganDonationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid donation.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const id = await createDonation(parsed.data, staff.seranganAdminId);
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/serangan/donations] failed to create', err);
    return NextResponse.json({ error: 'Could not save that donation.' }, { status: 500 });
  }
}
