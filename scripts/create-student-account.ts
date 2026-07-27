/**
 * Creates a student_accounts login for an existing child (matched by exact child_full_name).
 * Usage: npm run db:create-student -- "Noah Francis Noor" noah.f
 */
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { ensureSchema, sql } from '../src/lib/db';

const [childFullName, username] = process.argv.slice(2);

if (!childFullName || !username) {
  console.error('Usage: tsx scripts/create-student-account.ts "<Child Full Name>" <username>');
  process.exit(1);
}

function generateTempPassword(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(8);
  let out = '';
  for (const byte of bytes) {
    out += alphabet[byte % alphabet.length];
  }
  return out;
}

async function main() {
  await ensureSchema();

  const children = await sql`SELECT id FROM children WHERE child_full_name = ${childFullName}`;
  if (children.length === 0) {
    console.error(`No child found with full name "${childFullName}".`);
    process.exit(1);
  }
  if (children.length > 1) {
    console.error(`Multiple children found with full name "${childFullName}" — this script needs a unique match.`);
    process.exit(1);
  }
  const childId = children[0].id;

  const existing = await sql`SELECT id FROM student_accounts WHERE child_id = ${childId}`;
  if (existing.length > 0) {
    console.log(`A student account already exists for ${childFullName}; not touching it.`);
    return;
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await sql`
    INSERT INTO student_accounts (child_id, username, password_hash)
    VALUES (${childId}, ${username}, ${passwordHash})
  `;

  console.log(`Created student login for ${childFullName}.`);
  console.log(`Username: ${username}`);
  console.log(`Temporary password (shown once, not stored anywhere in the repo): ${tempPassword}`);
  console.log('Log in at /student/login.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
