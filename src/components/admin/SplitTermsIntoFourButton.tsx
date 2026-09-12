'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

interface GroupPlan {
  className: string;
  subject: string;
  status: 'planned' | 'skipped';
  reason?: string;
  oldTermLabels: string[];
  buckets?: { unitTitles: string[]; lessonCount: number }[];
}
interface Plan {
  groups: GroupPlan[];
  plannedCount: number;
  skippedCount: number;
}

/** One-off admin action: restructures every class/subject's curriculum pacing from 3 terms to 4
 * (see src/lib/curriculum-term-split.ts for the actual split logic and its rationale). Runs
 * against this deployment's own database, unlike scripts/split-terms-into-four.ts which needs
 * terminal access -- preview first, then an explicit confirm, since this rewrites real content
 * across the whole school at once and can't be undone by this panel. */
export default function SplitTermsIntoFourButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [applying, setApplying] = useState(false);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function preview() {
    setOpen(true);
    setLoading(true);
    setError(null);
    setAppliedCount(null);
    try {
      const res = await fetch('/api/admin/curriculum/split-terms-into-four');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not compute the split plan.');
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not compute the split plan.');
    } finally {
      setLoading(false);
    }
  }

  async function apply() {
    setApplying(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/curriculum/split-terms-into-four', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not apply the split.');
      setAppliedCount(data.appliedGroups.length);
      setPlan(data.plan);
      setConfirming(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not apply the split.');
    } finally {
      setApplying(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={preview}
        className="rounded-full border-2 border-teal-deep px-4 py-1.5 text-xs font-bold text-teal-deep hover:bg-teal-deep hover:text-white"
      >
        🗓️ Split every programme into 4 terms
      </button>
    );
  }

  return (
    <div className="rounded-md border-2 border-teal/40 bg-teal/5 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-teal-deep">Split curriculum pacing into 4 terms</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-ink-soft hover:underline">
          Close
        </button>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        For every class/subject with exactly 3 terms, moves its existing units into 4 new terms instead -- cutting only
        between units, balanced by lesson count. Unit and lesson content is never rewritten, so progress, worksheet/answer
        submissions, and translations all carry over untouched. Doesn&apos;t touch the school&apos;s academic calendar or
        tuition periods.
      </p>

      {loading && <p className="mt-3 text-sm text-ink-soft">Computing…</p>}
      {error && <p className="mt-3 text-xs font-semibold text-orange-deep">{error}</p>}

      {appliedCount !== null && (
        <p className="mt-3 rounded-sm bg-teal/15 px-3 py-2 text-sm font-semibold text-teal-deep">
          Done -- split {appliedCount} programme{appliedCount === 1 ? '' : 's'} into 4 terms.
        </p>
      )}

      {plan && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
            {plan.plannedCount} to split · {plan.skippedCount} skipped
          </p>
          <div className="max-h-96 overflow-y-auto rounded-sm border border-sand-line bg-white p-3">
            {plan.groups.map((g) => (
              <div key={`${g.className}::${g.subject}`} className="border-b border-sand-line/60 py-2 text-sm last:border-0">
                <p className="font-semibold text-ink">
                  {g.className} · {g.subject}{' '}
                  <span className="font-normal text-ink-soft">({g.oldTermLabels.join(', ')})</span>
                </p>
                {g.status === 'skipped' ? (
                  <p className="mt-0.5 text-xs text-orange-deep">Skipped: {g.reason}</p>
                ) : (
                  <ul className="mt-1 flex flex-col gap-0.5 pl-3 text-xs text-ink-soft">
                    {g.buckets!.map((b, i) => (
                      <li key={i}>
                        <span className="font-semibold text-teal-deep">Term {i + 1}:</span> {b.unitTitles.length} unit(s), {b.lessonCount} lessons
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {plan.plannedCount > 0 && appliedCount === null && (
            <div>
              {confirming ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-orange-deep">
                    Apply this now? This rewrites every listed programme&apos;s term structure immediately.
                  </span>
                  <Button type="button" variant="primary" onClick={apply} disabled={applying}>
                    {applying ? 'Applying…' : 'Yes, apply now'}
                  </Button>
                  <button type="button" onClick={() => setConfirming(false)} className="text-xs font-semibold text-ink-soft hover:underline">
                    Cancel
                  </button>
                </div>
              ) : (
                <Button type="button" variant="primary" onClick={() => setConfirming(true)}>
                  Apply this split
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
