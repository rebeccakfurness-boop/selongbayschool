import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getCcaSettings, getCcaReviewForChild } from '@/lib/cca';
import CcaSelectionReview from '@/components/admin/CcaSelectionReview';

export const dynamic = 'force-dynamic';

export default async function CcaReviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  await ensureSchema();
  const { id: idParam } = await params;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) notFound();

  const children = await sql`SELECT child_full_name, child_nickname FROM children WHERE id = ${childId}`;
  const child = children[0];
  if (!child) notFound();

  const settings = await getCcaSettings();
  const selection = settings.term_label ? await getCcaReviewForChild(childId, settings.term_label) : null;

  return (
    <section>
      <Link href={`/admin/families/${childId}`} className="text-sm font-semibold text-teal-deep hover:underline">
        ← Back to child card
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">
        CCA Review: {(child.child_nickname as string) || (child.child_full_name as string)}
      </h1>
      <p className="mt-1 text-sm text-ink-soft">{settings.term_label}</p>

      <div className="mt-6">
        {selection ? (
          <CcaSelectionReview childId={childId} selection={selection} />
        ) : (
          <div className="rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft">
            Nothing submitted yet for this term.
          </div>
        )}
      </div>
    </section>
  );
}
