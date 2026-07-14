import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { ensureSchema, sql } from '../src/lib/db';

const ADMIN_EMAIL = 'hello@selongbayschool.com';

function generateTempPassword(): string {
  // Avoids visually ambiguous characters (0/O, 1/l/I) since this is read and retyped by a person.
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(16);
  let out = '';
  for (const byte of bytes) {
    out += alphabet[byte % alphabet.length];
  }
  return out;
}

async function main() {
  await ensureSchema();

  const existing = await sql`SELECT id FROM admin_users WHERE email = ${ADMIN_EMAIL}`;
  if (existing.length > 0) {
    console.log(`admin_users already has a row for ${ADMIN_EMAIL}; not touching the existing password.`);
    return;
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await sql`
    INSERT INTO admin_users (email, password_hash)
    VALUES (${ADMIN_EMAIL}, ${passwordHash})
  `;

  console.log(`Created admin_users row for ${ADMIN_EMAIL}.`);
  console.log(`Temporary password (shown once, not stored anywhere in the repo): ${tempPassword}`);
  console.log('Log in at /admin/login and change this on first login.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
