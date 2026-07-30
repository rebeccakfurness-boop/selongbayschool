import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/current-staff';
import { ensureSchema } from '@/lib/db';
import { getLetterOfOfferById } from '@/lib/letters-of-offer';
import LetterOfOfferForm from '@/components/admin/LetterOfOfferForm';

export const dynamic = 'force-dynamic';

export default async function EditLetterOfOfferPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  await ensureSchema();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const letter = await getLetterOfOfferById(id);
  if (!letter) notFound();

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Edit Letter of Offer — {letter.child_full_name}</h1>
      {letter.status === 'accepted' && (
        <p className="mt-2 rounded-sm bg-orange/10 px-3 py-2 text-sm font-semibold text-orange-deep">
          This letter has already been accepted and can no longer be edited.
        </p>
      )}
      <div className="mt-6">
        <LetterOfOfferForm
          letterId={id}
          initialStartDate={letter.start_date}
          initialProgramme={letter.programme || ''}
          initialClassName={letter.class_name || ''}
          initialTuitionPlan={letter.tuition_plan || ''}
          initialFeesNote={letter.fees_note || ''}
          initialAdditionalTerms={letter.additional_terms || ''}
          redirectTo={`/admin/families/${letter.child_id}`}
        />
      </div>
    </section>
  );
}
