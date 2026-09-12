/**
 * Creates a student_accounts login for an existing child (matched by exact child_full_name).
 * Usage: npm run db:create-student -- "Noah Francis Noor" noah.f
 *
 * The admin Child Card now has a "Student Login" panel that does the same thing (plus password
 * reset) without needing terminal access -- this script is kept for bulk/offline use.
 */
import { ensureSchema, sql } from '../src/lib/db';
import { createStudentAccount } from '../src/lib/student-accounts';

const [childFullName, username] = process.argv.slice(2);

if (!childFullName || !username) {
  console.error('Usage: tsx scripts/create-student-account.ts "<Child Full Name>" <username>');
  process.exit(1);
}

async function main() {
  await ensureSchema();

  const children = (await sql`SELECT id FROM children WHERE child_full_name = ${childFullName}`) as unknown as { id: number }[];
  if (children.length === 0) {
    console.error(`No child found with full name "${childFullName}".`);
    process.exit(1);
  }
  if (children.length > 1) {
    console.error(`Multiple children found with full name "${childFullName}" — this script needs a unique match.`);
    process.exit(1);
  }
  const childId = children[0].id;

  const result = await createStudentAccount(childId, username);
  if (!result.ok) {
    if (result.error === 'already_exists') {
      console.log(`A student account already exists for ${childFullName}; not touching it.`);
      return;
    }
    console.error(`Username "${username}" is already taken by another student.`);
    process.exit(1);
  }

  console.log(`Created student login for ${childFullName}.`);
  console.log(`Username: ${username}`);
  console.log(`Temporary password (shown once, not stored anywhere in the repo): ${result.tempPassword}`);
  console.log('Log in at /student/login.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
