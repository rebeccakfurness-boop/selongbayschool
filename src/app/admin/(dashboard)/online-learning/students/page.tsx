import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass, getAssignedClasses } from '@/lib/current-staff';
import { getOnlineLearningStudents } from '@/lib/online-learning';
import OnlineLearningSubNav from '@/components/admin/OnlineLearningSubNav';
import EnableOnlineLearningForm from '@/components/admin/EnableOnlineLearningForm';

export const dynamic = 'force-dynamic';

export default async function AdminOnlineLearningStudentsPage() {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const isAdmin = staff.role === 'admin';

  const all = await getOnlineLearningStudents();
  const students = [];
  for (const s of all) {
    if (await canAccessClass(staff, s.class_name)) students.push(s);
  }

  const classOptions = isAdmin
    ? ((await sql`SELECT DISTINCT class_name FROM children WHERE class_name IS NOT NULL ORDER BY class_name`) as unknown as { class_name: string }[]).map(
        (r) => r.class_name
      )
    : await getAssignedClasses(staff.adminUserId);

  const candidates =
    classOptions.length === 0
      ? []
      : ((await sql`
          SELECT id, child_full_name, class_name FROM children
          WHERE class_name = ANY(${classOptions}) AND online_learning_enabled = false
          ORDER BY child_full_name
        `) as unknown as { id: number; child_full_name: string; class_name: string | null }[]);

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Online Students</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Turn on self-directed online learning for one specific student, then give them their own programme and a
        weekly timetable of when to do it. Their parent sees the same schedule and can watch or complete it
        alongside them from the parent portal.
      </p>
      <OnlineLearningSubNav active="/admin/online-learning/students" />

      <div className="mt-4">
        <EnableOnlineLearningForm candidates={candidates} />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {students.map((s) => (
          <Link
            key={s.child_id}
            href={`/admin/online-learning/students/${s.child_id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-sand-line bg-paper p-4 shadow-soft hover:border-teal"
          >
            <div>
              <p className="font-semibold text-ink">{s.child_full_name}</p>
              <p className="text-xs text-ink-soft">{s.class_name ?? 'No class set'}</p>
            </div>
            <p className="text-xs text-ink-soft">
              {s.programme_term_count} programme{s.programme_term_count === 1 ? '' : 's'} · {s.schedule_slot_count} weekly slot
              {s.schedule_slot_count === 1 ? '' : 's'}
            </p>
          </Link>
        ))}
        {students.length === 0 && (
          <p className="rounded-md border border-sand-line bg-paper p-6 text-center text-sm text-ink-soft">
            No students have online learning turned on yet.
          </p>
        )}
      </div>
    </section>
  );
}
