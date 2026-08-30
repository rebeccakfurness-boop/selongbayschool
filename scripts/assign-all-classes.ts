import { sql, ensureSchema } from '../src/lib/db';

/** Assigns one existing teacher account to every distinct class_name currently in use (the same
 * list the Staff admin page's "Add a class..." dropdown offers) -- a one-shot bulk version of
 * clicking "Add" there once per class, for when "give X access to all classes" means literally
 * all of them rather than a specific few. Does not create the account or change its role: it must
 * already exist with role = 'teacher' (an admin already sees every class without any assignment
 * row, so this would be a no-op for one).
 *
 * Usage:
 *   npm run db:assign-all-classes -- <email>
 */

async function main() {
  const [email] = process.argv.slice(2);
  if (!email) {
    console.error('Usage: npm run db:assign-all-classes -- <email>');
    process.exit(1);
  }

  await ensureSchema();

  const [staffRow] = (await sql`
    SELECT id, email, role, is_active FROM admin_users WHERE lower(email) = lower(${email})
  `) as unknown as { id: number; email: string; role: string; is_active: boolean }[];

  if (!staffRow) {
    console.error(`No staff account found for ${email}. Create it first from Admin -> Staff.`);
    process.exit(1);
  }
  if (staffRow.role !== 'teacher') {
    console.error(`${staffRow.email} has role "${staffRow.role}", not "teacher" -- class assignments only apply to teachers. Nothing changed.`);
    process.exit(1);
  }
  if (!staffRow.is_active) {
    console.warn(`Note: ${staffRow.email}'s account is currently deactivated. Assigning classes anyway, but they won't be able to log in until reactivated.`);
  }

  const classRows = (await sql`
    SELECT DISTINCT class_name FROM children WHERE class_name IS NOT NULL ORDER BY class_name
  `) as unknown as { class_name: string }[];
  const classNames = classRows.map((r) => r.class_name);

  if (classNames.length === 0) {
    console.log('No classes found (no child has a class_name set). Nothing to assign.');
    return;
  }

  console.log(`Assigning ${staffRow.email} to ${classNames.length} class(es):\n  ${classNames.join('\n  ')}\n`);

  for (const className of classNames) {
    await sql`
      INSERT INTO teacher_assignments (admin_user_id, class_name) VALUES (${staffRow.id}, ${className})
      ON CONFLICT (admin_user_id, class_name) DO NOTHING
    `;
  }

  const [{ n }] = (await sql`
    SELECT count(*)::int AS n FROM teacher_assignments WHERE admin_user_id = ${staffRow.id}
  `) as unknown as { n: number }[];

  console.log(`Done. ${staffRow.email} is now assigned to ${n} class(es) total.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
