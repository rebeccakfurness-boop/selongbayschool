'use client';

import { useState } from 'react';
import Button from '@/components/Button';

interface RescheduleResult {
  termStart: string;
  termWeeks: number;
  created: number;
  deleted: number;
  cancelled: number;
  emailed: number;
}

export default function RescheduleActivitiesButton({ onDone }: { onDone?: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RescheduleResult | null>(null);

  async function run() {
    if (
      !confirm(
        'This replaces every current and future session for the five weekday activities and School Tour with the new ' +
        '10-week term (1:30-3:30pm, starting 27 July; School Tour hourly 9am-1pm Mon-Fri). Any old slot that’s not ' +
        'part of the new schedule will be removed — sessions with real bookings will be cancelled and those ' +
        'families will be emailed. This cannot be undone. Continue?'
      )
    ) {
      return;
    }
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/reschedule-activities', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reschedule activities');
      setResult(data.result);
      if (onDone) onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reschedule activities');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-md border border-orange/30 bg-orange/5 p-5">
      <h3 className="font-display text-base font-semibold text-ink">Reschedule to new term</h3>
      <p className="mt-1 text-sm text-ink-soft">
        Replaces all upcoming sessions for the five weekday activities and School Tour with the new 10-week term
        schedule, removing every other slot for those activities.
      </p>
      <div className="mt-3">
        <Button type="button" variant="accent" onClick={run} disabled={pending}>
          {pending ? 'Rescheduling…' : 'Reschedule now'}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-orange-deep">{error}</p>}
      {result && (
        <p className="mt-2 text-sm font-semibold text-teal-deep">
          Done. Created {result.created} new session(s) for the term starting {result.termStart}. Removed {result.deleted} empty
          session(s) and cancelled {result.cancelled} session(s) that had bookings ({result.emailed} cancellation email(s) sent).
        </p>
      )}
    </div>
  );
}
