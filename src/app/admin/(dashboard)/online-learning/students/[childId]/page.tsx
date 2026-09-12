import Link from 'next/link';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass, getAssignedClasses } from '@/lib/current-staff';
import { getAllCurriculumTerms, getCurriculumTermsForClasses } from '@/lib/curriculum';
import { getChildOnlineProgrammeTerms, getChildOnlineScheduleWithNextLessons } from '@/lib/online-learning';
import OnlineLearningSubNav from '@/components/admin/OnlineLearningSubNav';
import OnlineStudentManager from '@/components/admin/OnlineStudentManager';

export const dynamic = 'force-dynamic';

export default async function AdminOnlineLearningStudentPage({ params }: { params: Promise<{ childId: string }> }) {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const { childId: idParam } = await params;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) {
    return <NotFound />;
  }

  const [child] = (await sql`
    SELECT id, child_full_name, class_name, online_learning_enabled FROM children WHERE id = ${childId}
  `) as unknown as { id: number; child_full_name: string; class_name: string | null; online_learning_enabled: boolean }[];
  if (!child) {
    return <NotFound />;
  }
  if (!(await canAccessClass(staff, child.class_name))) {
    return (
      <section>
        <h1 className="font-display text-2xl font-semibold text-ink">Not available</h1>
        <p className="mt-2 text-sm text-ink-soft">You are not assigned to {child.class_name ?? 'this student’s class'}.</p>
        <Link href="/admin/online-learning/students" className="mt-4 inline-block text-sm font-semibold text-teal-deep underline">
          ← Back to Online Students
        </Link>
      </section>
    );
  }

  const [programme, schedule, allTerms] = await Promise.all([
    getChildOnlineProgrammeTerms(childId),
    getChildOnlineScheduleWithNextLessons(childId),
    staff.role === 'admin' ? getAllCurriculumTerms() : getCurriculumTermsForClasses(await getAssignedClasses(staff.adminUserId)),
  ]);

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
        <Link href="/admin/online-learning/students" className="hover:underline">Online Students</Link> / {child.child_full_name}
      </p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{child.child_full_name}</h1>
          <p className="mt-1 text-sm text-ink-soft">{child.class_name ?? 'No class set'}</p>
        </div>
        <OnlineLearningSubNav active="/admin/online-learning/students" />
      </div>

      {!child.online_learning_enabled && (
        <p className="mt-4 rounded-md border border-orange-deep/40 bg-orange/10 px-4 py-3 text-sm font-semibold text-orange-deep">
          Online learning is currently turned off for this student -- turn it back on from the Online Students list to
          let them log in and see this programme and schedule again.
        </p>
      )}

      <div className="mt-6">
        <OnlineStudentManager childId={childId} allTerms={allTerms} initialProgramme={programme} initialSchedule={schedule} />
      </div>
    </section>
  );
}

function NotFound() {
  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Student not found</h1>
      <Link href="/admin/online-learning/students" className="mt-4 inline-block text-sm font-semibold text-teal-deep underline">
        ← Back to Online Students
      </Link>
    </section>
  );
}
