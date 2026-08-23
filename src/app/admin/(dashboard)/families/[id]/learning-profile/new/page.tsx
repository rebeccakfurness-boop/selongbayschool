import { notFound } from 'next/navigation';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import LearningProfileForm, { emptyLearningProfileForm } from '@/components/admin/LearningProfileForm';

export const dynamic = 'force-dynamic';

export default async function NewLearningProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) notFound();

  const children = await sql`SELECT class_name, child_full_name FROM children WHERE id = ${childId}`;
  const child = children[0];
  if (!child) notFound();
  if (!(await canAccessClass(staff, child.class_name as string | null))) notFound();

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">New term report: {child.child_full_name as string}</h1>
      <div className="mt-6">
        <LearningProfileForm childId={childId} initial={emptyLearningProfileForm} />
      </div>
    </section>
  );
}
