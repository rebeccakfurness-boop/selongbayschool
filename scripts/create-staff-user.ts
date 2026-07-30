/**
 * Creates an additional admin_users row (admin or teacher role). seed-admin-user.ts stays as the
 * one-time bootstrap for the hello@ admin account; use this for every account after that.
 *
 * Usage: npm run db:create-staff -- teacher@example.com teacher
 *        npm run db:create-staff -- someone@example.com admin
 */
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { ensureSchema, sql } from '../src/lib/db';

const [email, roleArg] = process.argv.slice(2);
const role = roleArg === 'admin' ? 'admin' : 'teacher';

if (!email) {
  console.error('Usage: tsx scripts/create-staff-user.ts <email> [admin|teacher]');
  process.exit(1);
}

function generateTempPassword(): string {
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

  const existing = await sql`SELECT id FROM admin_users WHERE email = ${email}`;
  if (existing.length > 0) {
    console.log(`admin_users already has a row for ${email}; not touching it. Update the role manually with SQL if needed.`);
    return;
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await sql`
    INSERT INTO admin_users (email, password_hash, role)
    VALUES (${email}, ${passwordHash}, ${role})
  `;

  console.log(`Created ${role} account for ${email}.`);
  console.log(`Temporary password (shown once, not stored anywhere in the repo): ${tempPassword}`);
  console.log('Log in at /admin/login and change this on first login.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
