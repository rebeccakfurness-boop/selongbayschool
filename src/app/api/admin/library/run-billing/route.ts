import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/current-staff';
import { runLibraryBilling } from '@/lib/library';

export async function POST() {
  await requireAdmin();
  try {
    const result = await runLibraryBilling();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[api/admin/library/run-billing] failed', err);
    return NextResponse.json({ error: 'Could not run library billing.' }, { status: 500 });
  }
}
