import Link from 'next/link';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { getCurriculumTermTree, getSyllabusTopicsForTerm, getAssignableOccurrences } from '@/lib/curriculum';
import LessonPlanningDashboard from '@/components/admin/LessonPlanningDashboard';

export const dynamic = 'force-dynamic';

export default async function LessonPlanningDashboardPage({ params }: { params: Promise<{ termId: string }> }) {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const { termId: termIdParam } = await params;
  const termId = Number(termIdParam);

  if (!Number.isInteger(termId)) {
    return <NotFound />;
  }

  const term = await getCurriculumTermTree(termId, true);
  if (!term) {
    return <NotFound />;
  }
  if (!(await canAccessClass(staff, term.class_name))) {
    return (
      <section>
        <h1 className="font-display text-2xl font-semibold text-ink">Not available</h1>
        <p className="mt-2 text-sm text-ink-soft">You are not assigned to {term.class_name}.</p>
        <Link href="/admin/teaching/curriculum-plans" className="mt-4 inline-block text-sm font-semibold text-teal-deep underline">
          ← Back to Curriculum Plans
        </Link>
      </section>
    );
  }

  const [syllabusTopics, assignableOccurrences] = await Promise.all([
    getSyllabusTopicsForTerm(termId),
    getAssignableOccurrences(term.class_name, term.subject),
  ]);

  return <LessonPlanningDashboard term={term} syllabusTopics={syllabusTopics} assignableOccurrences={assignableOccurrences} />;
}

function NotFound() {
  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Programme not found</h1>
      <Link href="/admin/teaching/curriculum-plans" className="mt-4 inline-block text-sm font-semibold text-teal-deep underline">
        ← Back to Curriculum Plans
      </Link>
    </section>
  );
}
