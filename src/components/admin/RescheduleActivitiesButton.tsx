'use client';

import { useState } from 'react';
import Button from '@/components/Button';

interface RescheduleResult {
  termStart: string;
  termWeeks: number;
  created: number;
  capacityUpdated: number;
  deleted: number;
  cancelled: number;
  emailed: number;
  deactivated: number;
}

export default function RescheduleActivitiesButton({ onDone }: { onDone?: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RescheduleResult | null>(null);

  async function run() {
    if (
      !confirm(
        'This syncs current and future sessions to the latest term schedule: weekday activities 1:30-3:30pm ' +
        '(Gymnastics for Kids & Free Swim on Tuesdays, Football and Feeling Crafty on Mondays from 3 August, ' +
        'Gardening and Padel on Fridays), and School Tour at midday Mon-Fri (capacity 8). Gymnastics Term 2 is a separate "Coming in ' +
        'September" activity with no bookable sessions yet. Hip Hop Dance and Ninja Warrior stays retired, and so ' +
        'are the duplicate "Gymnastics Term 1" activity and Scouts and Survival Challenge (replaced by Gardening ' +
        'and Padel). Any old slot that’s not part of the new schedule will be removed — sessions with real ' +
        'bookings will be cancelled and those families will be emailed. This cannot be undone. Continue?'
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
        Syncs upcoming sessions to the latest term schedule (School Tour midday, Football and Feeling Crafty from 3
        August, Gymnastics &amp; Free Swim back on Tuesdays, Gardening and Padel on Fridays, Gymnastics Term 2 set to &quot;Coming in
        September&quot; with no bookable sessions yet, Hip Hop Dance &amp; Ninja Warrior, the duplicate
        &quot;Gymnastics Term 1&quot;, and Scouts and Survival Challenge all retired) and removes every slot that no
        longer belongs.
      </p>
      <div className="mt-3">
        <Button type="button" variant="accent" onClick={run} disabled={pending}>
          {pending ? 'Rescheduling…' : 'Reschedule now'}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-orange-deep">{error}</p>}
      {result && (
        <p className="mt-2 text-sm font-semibold text-teal-deep">
          Done. Created {result.created} new session(s) for the term starting {result.termStart}
          {result.capacityUpdated > 0 && <>, updated capacity on {result.capacityUpdated} existing session(s)</>}. Removed{' '}
          {result.deleted} empty session(s) and cancelled {result.cancelled} session(s) that had bookings ({result.emailed} cancellation
          email(s) sent). Deactivated {result.deactivated} retired activity(ies).
        </p>
      )}
    </div>
  );
}
