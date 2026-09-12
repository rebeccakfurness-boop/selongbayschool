import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { resetStudentAccountPassword } from '@/lib/student-accounts';

/** Issues a brand-new temp password for an existing student login -- the only way to recover a
 * forgotten one, since the old password is bcrypt-hashed and was only ever shown once. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  if (staff.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can manage student logins.' }, { status: 403 });
  }

  const { id: idParam } = await params;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) {
    return NextResponse.json({ error: 'Invalid child id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const result = await resetStudentAccountPassword(childId);
    if (!result.ok) {
      return NextResponse.json({ error: 'This student has no login to reset yet.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, tempPassword: result.tempPassword });
  } catch (err) {
    console.error('[api/admin/children/:id/student-account/reset-password] failed', err);
    return NextResponse.json({ error: 'Could not reset this password.' }, { status: 500 });
  }
}
