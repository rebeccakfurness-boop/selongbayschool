'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CancelSessionButton({
  sessionId,
  activityName,
  date,
  time,
  onCancelled,
}: {
  sessionId: number;
  activityName: string;
  date: string;
  time: string;
  /** If provided, called instead of router.refresh() (e.g. the main Activities page reloads its own fetched state). */
  onCancelled?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancelSession() {
    if (!confirm(`Cancel the ${activityName} session on ${date} at ${time}? All booked customers will be emailed.`)) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/availability/${sessionId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');
      if (onCancelled) onCancelled();
      else router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel session');
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={cancelSession}
        disabled={pending}
        className="text-left text-sm font-semibold text-orange-deep hover:underline disabled:opacity-50"
      >
        {pending ? 'Cancelling…' : 'Cancel this session'}
      </button>
      {error && <div className="mt-1 text-xs font-semibold text-orange-deep">{error}</div>}
    </div>
  );
}
