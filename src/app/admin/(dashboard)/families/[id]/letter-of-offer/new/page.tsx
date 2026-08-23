import { notFound } from 'next/navigation';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import LetterOfOfferForm from '@/components/admin/LetterOfOfferForm';

export const dynamic = 'force-dynamic';

export default async function NewLetterOfOfferPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  await ensureSchema();
  const { id: idParam } = await params;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) notFound();

  const rows = await sql`
    SELECT child_full_name, child_nickname, programme, class_name, tuition_plan
    FROM children WHERE id = ${childId}
  `;
  const child = rows[0];
  if (!child) notFound();

  const label = (child.child_nickname as string) || (child.child_full_name as string);

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">New Letter of Offer: {label}</h1>
      <div className="mt-6">
        <LetterOfOfferForm
          childId={childId}
          initialStartDate=""
          initialProgramme={(child.programme as string) || ''}
          initialClassName={(child.class_name as string) || ''}
          initialTuitionPlan={(child.tuition_plan as string) || ''}
          initialFeesNote=""
          initialAdditionalTerms=""
          redirectTo={`/admin/families/${childId}`}
        />
      </div>
    </section>
  );
}
