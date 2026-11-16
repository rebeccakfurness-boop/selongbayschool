import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { ensureSchema, sql } from '@/lib/db';
import { requireSeranganAdminApi } from '@/lib/current-serangan';
import { createSeranganUserSchema } from '@/lib/validation';
import { getAllSeranganUsers } from '@/lib/serangan';

function generateTempPassword(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(16);
  let out = '';
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out;
}

export async function GET() {
  try {
    await requireSeranganAdminApi();
  } catch {
    return NextResponse.json({ error: 'Not authorized to view Serangan accounts.' }, { status: 403 });
  }
  await ensureSchema();
  const users = await getAllSeranganUsers();
  return NextResponse.json({ users });
}

/** Only an 'admin' (Shaun, Elizabeth) can add a new Serangan login -- mirrors
 * /api/admin/staff's own create-with-temp-password flow exactly, just scoped to
 * serangan_admin_users and its own two-role set. */
export async function POST(req: NextRequest) {
  try {
    await requireSeranganAdminApi();
  } catch {
    return NextResponse.json({ error: 'Not authorized to create Serangan accounts.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = createSeranganUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid account.' }, { status: 400 });
  }
  const { email, displayName, role } = parsed.data;

  try {
    await ensureSchema();
    const existing = await sql`SELECT id FROM serangan_admin_users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const rows = await sql`
      INSERT INTO serangan_admin_users (email, password_hash, display_name, role)
      VALUES (${email}, ${passwordHash}, ${displayName || null}, ${role})
      RETURNING id
    `;

    // Shown once in the response only -- never stored anywhere else, same as the seed script.
    return NextResponse.json({ id: rows[0].id, tempPassword });
  } catch (err) {
    console.error('[api/serangan/users] failed to create', err);
    return NextResponse.json({ error: 'Could not create that account.' }, { status: 500 });
  }
}
