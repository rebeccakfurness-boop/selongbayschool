import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { formatDate } from '@/lib/admin-format';
import Button from '@/components/Button';

export const dynamic = 'force-dynamic';

interface ProfileRow {
  id: number;
  term_label: string;
  grade_label: string | null;
  created_at: string;
}

export default async function LearningProfileListPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) notFound();

  const children = await sql`SELECT child_full_name, child_nickname, class_name FROM children WHERE id = ${childId}`;
  const child = children[0];
  if (!child) notFound();
  if (!(await canAccessClass(staff, child.class_name as string | null))) notFound();

  const profiles = (await sql`
    SELECT id, term_label, grade_label, created_at FROM learning_profiles
    WHERE child_id = ${childId} ORDER BY created_at DESC
  `) as unknown as ProfileRow[];

  return (
    <section>
      <Link href={`/admin/families/${childId}`} className="text-sm font-semibold text-teal-deep hover:underline">
        ← Back to child card
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Learning Profile: {(child.child_nickname as string) || (child.child_full_name as string)}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">Term reports for this child.</p>
        </div>
        <Button href={`/admin/families/${childId}/learning-profile/new`} variant="primary">
          New term report
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {profiles.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-md border border-sand-line bg-paper p-4 shadow-soft">
            <div>
              <div className="font-display text-base font-semibold text-ink">{p.term_label}</div>
              <div className="text-xs text-ink-soft">
                {p.grade_label && `${p.grade_label} · `}Created {formatDate(p.created_at)}
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href={`/api/learning-profiles/${p.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-teal-deep hover:underline"
              >
                Print / PDF
              </a>
              <Link href={`/admin/families/${childId}/learning-profile/${p.id}`} className="text-sm font-semibold text-teal-deep hover:underline">
                Edit
              </Link>
            </div>
          </div>
        ))}
        {profiles.length === 0 && (
          <div className="rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft">
            No term reports yet.
          </div>
        )}
      </div>
    </section>
  );
}
