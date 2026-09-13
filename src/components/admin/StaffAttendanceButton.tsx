'use client';

import { useEffect, useState } from 'react';
import type { StaffAttendanceEventType } from '@/lib/staff-attendance';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: 'Asia/Makassar', hour: 'numeric', minute: '2-digit' });
}

/** Self check-in/out for the logged-in staff member -- the same one-tap idea as
 * AttendanceActionButton for parents, minus the signature step (this person is already logged
 * in; that session is the proof of who). Self-fetches its own status rather than needing it
 * threaded through the Overview page's two different role branches. */
export default function StaffAttendanceButton() {
  const [currentEventType, setCurrentEventType] = useState<StaffAttendanceEventType | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justDone, setJustDone] = useState<{ eventType: StaffAttendanceEventType; time: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/staff-attendance/status')
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled || !ok) return;
        setCurrentEventType(data.eventType);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const nextAction: StaffAttendanceEventType = currentEventType === 'check_in' ? 'check_out' : 'check_in';

  async function handleClick() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/staff-attendance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: nextAction }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not record check-in/out.');
      setCurrentEventType(nextAction);
      setJustDone({ eventType: nextAction, time: formatTime(data.occurredAt) });
      setTimeout(() => setJustDone(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record check-in/out.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!loaded) return null;

  if (justDone) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/15 px-4 py-2 text-sm font-bold text-teal-deep">
        ✓ {justDone.eventType === 'check_in' ? 'Checked in' : 'Checked out'} at {justDone.time}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting}
        className={`whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-60 ${
          nextAction === 'check_in' ? 'bg-teal hover:bg-teal-deep' : 'bg-orange-deep hover:bg-orange-deep/90'
        }`}
      >
        {submitting ? 'Saving…' : nextAction === 'check_in' ? 'Check In' : 'Check Out'}
      </button>
      {error && <span className="text-xs font-semibold text-orange-deep">{error}</span>}
    </div>
  );
}
