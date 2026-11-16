import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireSeranganAdminApi } from '@/lib/current-serangan';
import { updateSeranganUserSchema } from '@/lib/validation';
import { setSeranganUserActive } from '@/lib/serangan';

/** Deactivate/reactivate rather than delete -- see the schema comment on
 * serangan_admin_users.is_active in lib/db.ts for why (created_by/updated_by references all over
 * the dashboard's other tables). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireSeranganAdminApi();
  } catch {
    return NextResponse.json({ error: 'Not authorized to update Serangan accounts.' }, { status: 403 });
  }
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid account id.' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSeranganUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }

  if (String(id) === String(admin.seranganAdminId) && !parsed.data.isActive) {
    return NextResponse.json({ error: "You can't deactivate your own account." }, { status: 400 });
  }

  try {
    await ensureSchema();
    await setSeranganUserActive(id, parsed.data.isActive);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/serangan/users/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not update that account.' }, { status: 500 });
  }
}
