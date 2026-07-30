import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getClassroomProvider } from '@/lib/classroom/provider';

export async function POST() {
  await requireAdmin();
  await ensureSchema();

  const provider = await getClassroomProvider();
  if (!provider.isConfigured()) {
    return NextResponse.json({ error: 'Google Classroom is not connected.' }, { status: 400 });
  }

  const mappings = (await sql`SELECT google_course_id, class_name FROM classroom_course_mappings`) as unknown as {
    google_course_id: string;
    class_name: string;
  }[];

  if (mappings.length === 0) {
    return NextResponse.json({ error: 'No courses are mapped to a class yet.' }, { status: 400 });
  }

  let assignmentsSynced = 0;
  let submissionsSynced = 0;
  let submissionsMatched = 0;
  const errors: string[] = [];

  for (const mapping of mappings) {
    try {
      const students = await provider.listStudents(mapping.google_course_id);
      const emailByUserId = new Map(students.map((s) => [s.userId, s.email]));

      const coursework = await provider.listCoursework(mapping.google_course_id);
      for (const work of coursework) {
        const rows = await sql`
          INSERT INTO classroom_assignments (google_coursework_id, class_name, title, description, due_date, alternate_link, synced_at)
          VALUES (${work.id}, ${mapping.class_name}, ${work.title}, ${work.description}, ${work.dueDate}::date, ${work.alternateLink}, now())
          ON CONFLICT (google_coursework_id) DO UPDATE SET
            class_name = EXCLUDED.class_name, title = EXCLUDED.title, description = EXCLUDED.description,
            due_date = EXCLUDED.due_date, alternate_link = EXCLUDED.alternate_link, synced_at = now()
          RETURNING id
        `;
        const assignmentId = rows[0].id as number;
        assignmentsSynced++;

        const submissions = await provider.listSubmissions(mapping.google_course_id, work.id);
        for (const submission of submissions) {
          const email = emailByUserId.get(submission.userId) ?? null;
          let childId: number | null = null;
          if (email) {
            const matched = await sql`
              SELECT id FROM children WHERE classroom_student_email = ${email} OR primary_contact_email = ${email} LIMIT 1
            `;
            childId = (matched[0]?.id as number) ?? null;
          }
          await sql`
            INSERT INTO classroom_submissions (google_submission_id, classroom_assignment_id, child_id, google_student_email, state, alternate_link, synced_at)
            VALUES (${submission.id}, ${assignmentId}, ${childId}, ${email}, ${submission.state}, ${submission.alternateLink}, now())
            ON CONFLICT (google_submission_id) DO UPDATE SET
              child_id = EXCLUDED.child_id, state = EXCLUDED.state, alternate_link = EXCLUDED.alternate_link, synced_at = now()
          `;
          submissionsSynced++;
          if (childId) submissionsMatched++;
        }
      }
    } catch (err) {
      console.error(`[api/admin/classroom/sync] failed for course ${mapping.google_course_id}`, err);
      errors.push(mapping.class_name);
    }
  }

  await sql`UPDATE classroom_connection SET last_synced_at = now() WHERE id = 1`;

  return NextResponse.json({ assignmentsSynced, submissionsSynced, submissionsMatched, errors });
}
