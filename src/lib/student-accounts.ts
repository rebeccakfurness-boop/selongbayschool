import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { sql } from './db';

/** Shared by the admin "Student Login" panel on the Child Card and scripts/create-student-account.ts
 * (kept as a thin CLI wrapper over this) -- one place for how a temp password is generated and
 * hashed, so the two never drift. */
function generateTempPassword(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(8);
  let out = '';
  for (const byte of bytes) {
    out += alphabet[byte % alphabet.length];
  }
  return out;
}

export interface StudentAccountSummary {
  id: number;
  username: string;
  created_at: string;
  last_login_at: string | null;
}

export async function getStudentAccountForChild(childId: number): Promise<StudentAccountSummary | null> {
  const rows = (await sql`
    SELECT id, username, created_at::text, last_login_at::text FROM student_accounts WHERE child_id = ${childId}
  `) as unknown as StudentAccountSummary[];
  return rows[0] ?? null;
}

export async function isStudentUsernameTaken(username: string): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM student_accounts WHERE username = ${username}`;
  return rows.length > 0;
}

export type CreateStudentAccountResult =
  | { ok: true; tempPassword: string }
  | { ok: false; error: 'already_exists' | 'username_taken' };

/** Refuses to overwrite an existing account for this child (same rule as the script) -- use
 * resetStudentAccountPassword to issue a new password for an account that already exists. */
export async function createStudentAccount(childId: number, username: string): Promise<CreateStudentAccountResult> {
  const existing = await getStudentAccountForChild(childId);
  if (existing) return { ok: false, error: 'already_exists' };
  if (await isStudentUsernameTaken(username)) return { ok: false, error: 'username_taken' };

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await sql`INSERT INTO student_accounts (child_id, username, password_hash) VALUES (${childId}, ${username}, ${passwordHash})`;
  return { ok: true, tempPassword };
}

/** Issues a brand-new temp password for a child's existing login -- the only way to recover a
 * forgotten password today, since it's bcrypt-hashed and was never stored anywhere in plaintext. */
export async function resetStudentAccountPassword(childId: number): Promise<{ ok: true; tempPassword: string } | { ok: false; error: 'not_found' }> {
  const existing = await getStudentAccountForChild(childId);
  if (!existing) return { ok: false, error: 'not_found' };

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await sql`UPDATE student_accounts SET password_hash = ${passwordHash} WHERE child_id = ${childId}`;
  return { ok: true, tempPassword };
}
