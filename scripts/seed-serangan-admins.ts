import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { ensureSchema, sql } from '../src/lib/db';

const ACCOUNTS = [
  { email: 'shauncrittendon@gmail.com', displayName: 'Shaun Crittendon' },
  { email: 'liz@chnnl.app', displayName: 'Elizabeth' },
];

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

  for (const account of ACCOUNTS) {
    const existing = await sql`SELECT id FROM serangan_admin_users WHERE email = ${account.email}`;
    if (existing.length > 0) {
      console.log(`serangan_admin_users already has a row for ${account.email}; not touching the existing password.`);
      continue;
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await sql`
      INSERT INTO serangan_admin_users (email, password_hash, display_name)
      VALUES (${account.email}, ${passwordHash}, ${account.displayName})
    `;

    console.log(`Created serangan_admin_users row for ${account.email}.`);
    console.log(`Temporary password (shown once, not stored anywhere in the repo): ${tempPassword}`);
  }

  console.log('Log in at /serangan/login -- change the temporary password via "Forgot password?" on first login.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
