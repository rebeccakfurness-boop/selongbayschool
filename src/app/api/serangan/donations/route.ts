import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireSeranganAdminApi } from '@/lib/current-serangan';
import { upsertSeranganDonationSchema } from '@/lib/validation';
import { getRecentDonations, createDonation } from '@/lib/serangan';

export async function GET() {
  try {
    await requireSeranganAdminApi();
  } catch {
    return NextResponse.json({ error: 'Not authorized to view donations.' }, { status: 403 });
  }
  await ensureSchema();
  const donations = await getRecentDonations(200);
  return NextResponse.json({ donations });
}

export async function POST(req: NextRequest) {
  let staff;
  try {
    staff = await requireSeranganAdminApi();
  } catch {
    return NextResponse.json({ error: 'Not authorized to record donations.' }, { status: 403 });
  }

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
