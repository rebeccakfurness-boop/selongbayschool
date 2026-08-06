import { notFound } from 'next/navigation';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { getWorkSamplesForChild, getPhotoFeedForChild, getInvoicesForChild, getClassroomSubmissionsForChild } from '@/lib/lms-data';
import { getLettersOfOfferForChild } from '@/lib/letters-of-offer';
import { getWelcomeLetterForChild } from '@/lib/welcome-letters';
import { getOffboardingLettersForChild } from '@/lib/offboarding';
import { getMeetingInvitesForChild } from '@/lib/meeting-scheduling';
import { COMPLIANCE_STALE_AFTER_DAYS } from '@/lib/child-lifecycle-shared';
import ChildCard, { type ChildDetail } from '@/components/admin/ChildCard';
import type { GuardianLink } from '@/components/admin/GuardianLinksSection';

export const dynamic = 'force-dynamic';

/** Renders inline instead of throwing up to the site-wide error boundary (src/app/error.tsx),
 * which strips the real message from what reaches the browser in production — see the identical
 * BoardLoadError on the Family Board list page for the original case this pattern was built for. */
function ChildCardLoadError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Child Card</h1>
      <div className="mt-6 rounded-md border border-orange-deep/40 bg-orange/10 p-5">
        <p className="font-semibold text-orange-deep">This child&apos;s card couldn&apos;t load.</p>
        <p className="mt-2 text-sm text-ink-soft">
          This is usually a database schema mismatch rather than something wrong with the data. Please share this
          message so it can be fixed:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-sm bg-ink/5 p-3 text-xs text-ink">{message}</pre>
      </div>
    </section>
  );
}

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSchema();
    const staff = await getCurrentStaff();
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id)) notFound();

    const rows = (await sql`
      SELECT c.*,
        (
          (c.liability_form_signed AND c.liability_form_date < CURRENT_DATE - ${COMPLIANCE_STALE_AFTER_DAYS}::int) OR
          (c.photography_signed AND c.photography_form_date < CURRENT_DATE - ${COMPLIANCE_STALE_AFTER_DAYS}::int) OR
          (c.pickup_authorization_signed AND c.pickup_form_date < CURRENT_DATE - ${COMPLIANCE_STALE_AFTER_DAYS}::int) OR
          (c.behavioral_form_signed AND c.behavioral_form_date < CURRENT_DATE - ${COMPLIANCE_STALE_AFTER_DAYS}::int) OR
          (c.financial_agreement_signed AND c.financial_agreement_date < CURRENT_DATE - ${COMPLIANCE_STALE_AFTER_DAYS}::int)
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
    const welcomeLetter = await getWelcomeLetterForChild(id);
    const offboardingLetters = await getOffboardingLettersForChild(id);
    const meetingInvites = await getMeetingInvitesForChild(id);
    const classroomSubmissions = await getClassroomSubmissionsForChild(id);
    const guardians = (await sql`
      SELECT gc.customer_id, c.name, c.email, gc.relationship
      FROM guardian_children gc JOIN customers c ON c.id = gc.customer_id
      WHERE gc.child_id = ${id} AND gc.status = 'approved'
      ORDER BY c.email
    `) as unknown as GuardianLink[];

    return renderChildCard({
      child,
      canEdit: staff.role === 'admin',
      learningProfileCount,
      workSamples,
      photos,
      guardians,
      invoices,
      letters,
      welcomeLetter,
      offboardingLetters,
      meetingInvites,
      classroomSubmissions,
    });
  } catch (error) {
    // redirect()/notFound() work by throwing a special error Next.js's router looks for by
    // digest — must be rethrown, not swallowed as a normal failure, or navigation breaks silently.
    const digest = (error as { digest?: string } | null)?.digest;
    if (typeof digest === 'string' && (digest.startsWith('NEXT_REDIRECT') || digest.startsWith('NEXT_NOT_FOUND'))) {
      throw error;
    }
    console.error('[admin/families/:id] Child Card failed to load', error);
    return <ChildCardLoadError error={error} />;
  }
}

function renderChildCard(props: Parameters<typeof ChildCard>[0]) {
  return <ChildCard {...props} />;
}
