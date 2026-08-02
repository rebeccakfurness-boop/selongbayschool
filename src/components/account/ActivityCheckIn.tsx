'use client';

import { useEffect, useState } from 'react';
import AttendanceActionButton from '@/components/account/AttendanceActionButton';
import type { ActivityOption, AttendanceEventType } from '@/lib/attendance';

/** Kept as its own small flow (pick activity, then check in/out) rather than folded into the
 * daily one-tap button — a child can be checked into more than one activity a day, so there's no
 * single "current status" to toggle the way there is for the once-a-day gate check-in. */
export default function ActivityCheckIn({ childId, activities }: { childId: number; activities: ActivityOption[] }) {
  const [activityId, setActivityId] = useState<number | ''>('');
  const [statusResult, setStatusResult] = useState<{ activityId: number; eventType: AttendanceEventType | null } | null>(null);

  useEffect(() => {
    if (activityId === '') return;
    let cancelled = false;
    fetch(`/api/account/attendance/status?childId=${childId}&activityId=${activityId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setStatusResult({ activityId, eventType: data.eventType ?? null });
      });
    return () => {
      cancelled = true;
    };
  }, [childId, activityId]);

  if (activities.length === 0) return null;

  const loading = activityId !== '' && statusResult?.activityId !== activityId;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-sm border border-sand-line bg-sand/20 px-3 py-2">
      <select
        value={activityId}
        onChange={(e) => setActivityId(e.target.value ? Number(e.target.value) : '')}
        className="rounded-sm border border-sand-line bg-white px-2 py-1.5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
      >
        <option value="">Check into an activity…</option>
        {activities.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      {activityId !== '' && !loading && (
        <AttendanceActionButton childId={childId} sessionType="activity" activityId={activityId} currentEventType={statusResult?.eventType ?? null} />
      )}
      {loading && <span className="text-xs text-ink-soft">Loading…</span>}
    </div>
  );
}
