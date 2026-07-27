import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { z } from 'zod';

const createStaffSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  role: z.enum(['admin', 'teacher']),
});

function generateTempPassword(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(16);
  let out = '';
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out;
}

export async function POST(req: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = createStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid staff account.' }, { status: 400 });
  }
  const { email, role } = parsed.data;

  try {
    await ensureSchema();
    const existing = await sql`SELECT id FROM admin_users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const rows = await sql`
      INSERT INTO admin_users (email, password_hash, role) VALUES (${email}, ${passwordHash}, ${role}) RETURNING id
    `;

    // Shown once in the response only — never stored anywhere else, same as the CLI script.
    return NextResponse.json({ id: rows[0].id, tempPassword });
  } catch (err) {
    console.error('[api/admin/staff] failed to create', err);
    return NextResponse.json({ error: 'Could not create staff account.' }, { status: 500 });
  }
}
