import { notFound } from 'next/navigation';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { getWorkSamplesForChild, getPhotoFeedForChild, getInvoicesForChild, getClassroomSubmissionsForChild } from '@/lib/lms-data';
import { getLettersOfOfferForChild } from '@/lib/letters-of-offer';
import { COMPLIANCE_STALE_AFTER_DAYS } from '@/lib/child-lifecycle-shared';
import ChildCard, { type ChildDetail } from '@/components/admin/ChildCard';
import type { GuardianLink } from '@/components/admin/GuardianLinksSection';

export const dynamic = 'force-dynamic';

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const rows = (await sql`
    SELECT c.*,
      (
        (c.liability_form_signed AND c.liability_form_date < CURRENT_DATE - ${COMPLIANCE_STALE_AFTER_DAYS}) OR
        (c.photography_signed AND c.photography_form_date < CURRENT_DATE - ${COMPLIANCE_STALE_AFTER_DAYS}) OR
        (c.pickup_authorization_signed AND c.pickup_form_date < CURRENT_DATE - ${COMPLIANCE_STALE_AFTER_DAYS}) OR
        (c.behavioral_form_signed AND c.behavioral_form_date < CURRENT_DATE - ${COMPLIANCE_STALE_AFTER_DAYS}) OR
        (c.financial_agreement_signed AND c.financial_agreement_date < CURRENT_DATE - ${COMPLIANCE_STALE_AFTER_DAYS})
      ) AS compliance_out_of_date
    FROM children c WHERE c.id = ${id}
  `) as unknown as ChildDetail[];
  const child = rows[0];
  if (!child) notFound();

  if (staff.role === 'teacher') {
    const assigned = (await sql`
      SELECT 1 FROM teacher_assignments WHERE admin_user_id = ${staff.adminUserId} AND class_name = ${child.class_name}
    `) as unknown as unknown[];
    if (assigned.length === 0) notFound();
  }

  const [{ count: learningProfileCount }] = (await sql`
    SELECT COUNT(*)::int AS count FROM learning_profiles WHERE child_id = ${id}
  `) as unknown as { count: number }[];

  const workSamples = await getWorkSamplesForChild(id);
  const photos = await getPhotoFeedForChild(id, child.class_name);
  const invoices = await getInvoicesForChild(id);
  const letters = await getLettersOfOfferForChild(id);
  const classroomSubmissions = await getClassroomSubmissionsForChild(id);
  const guardians = (await sql`
    SELECT gc.customer_id, c.name, c.email, gc.relationship
    FROM guardian_children gc JOIN customers c ON c.id = gc.customer_id
    WHERE gc.child_id = ${id}
    ORDER BY c.email
  `) as unknown as GuardianLink[];

  return (
    <ChildCard
      child={child}
      canEdit={staff.role === 'admin'}
      learningProfileCount={learningProfileCount}
      workSamples={workSamples}
      photos={photos}
      guardians={guardians}
      invoices={invoices}
      letters={letters}
      classroomSubmissions={classroomSubmissions}
    />
  );
}
