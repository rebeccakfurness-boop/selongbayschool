'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AttendanceSignModal from '@/components/account/AttendanceSignModal';
import type { AttendanceEventType } from '@/lib/attendance';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: 'Asia/Makassar', hour: 'numeric', minute: '2-digit' });
}

/** One-tap-to-open check in/out — the button's own label and action toggle based on the child's
 * current status, so a parent never has to pick between two buttons. "One-tap" now opens a
 * sign-to-confirm modal rather than submitting immediately: every parent-portal check-in/out
 * requires a signature (see attendanceCheckSchema) — an admin can check a child in/out without one
 * from the Child Card's "Add correction" form, which is the explicit override for when a parent
 * isn't the one doing it. */
export default function AttendanceActionButton({
  childId,
  childName,
  sessionType,
  activityId,
  currentEventType,
  onDone,
}: {
  childId: number;
  childName: string;
  sessionType: 'daily' | 'activity';
  activityId?: number | null;
  currentEventType: AttendanceEventType | null;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [signing, setSigning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justDone, setJustDone] = useState<{ eventType: AttendanceEventType; time: string } | null>(null);

  const nextAction: AttendanceEventType = currentEventType === 'check_in' ? 'check_out' : 'check_in';

  async function handleConfirm(signatureDataUrl: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/account/attendance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, eventType: nextAction, sessionType, activityId: activityId ?? null, signatureDataUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not record check-in/out.');
      setSigning(false);
      setJustDone({ eventType: nextAction, time: formatTime(data.occurredAt) });
      router.refresh();
      onDone?.();
      setTimeout(() => setJustDone(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record check-in/out.');
    } finally {
      setSubmitting(false);
    }
  }

  if (justDone) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/15 px-3 py-1.5 text-xs font-bold text-teal-deep">
        ✓ {justDone.eventType === 'check_in' ? 'Checked in' : 'Checked out'} at {justDone.time}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setSigning(true);
        }}
        className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold text-white transition-colors disabled:opacity-60 ${
          nextAction === 'check_in' ? 'bg-teal hover:bg-teal-deep' : 'bg-orange-deep hover:bg-orange-deep/90'
        }`}
      >
        {nextAction === 'check_in' ? 'Check In' : 'Check Out'}
      </button>
      {error && !signing && <span className="ml-2 text-xs font-semibold text-orange-deep">{error}</span>}

      {signing && (
        <AttendanceSignModal
          title={`Sign to check ${childName} ${nextAction === 'check_in' ? 'in' : 'out'}`}
          confirmLabel={nextAction === 'check_in' ? 'Confirm Check In' : 'Confirm Check Out'}
          submitting={submitting}
          error={error}
          onCancel={() => setSigning(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
