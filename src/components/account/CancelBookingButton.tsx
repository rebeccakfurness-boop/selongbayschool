'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CancelBookingButton({
  bookingId,
  activityName,
  date,
}: {
  bookingId: number;
  activityName: string;
  date: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancelBooking() {
    if (!confirm(`Are you sure you want to cancel your booking for ${activityName} on ${date}?`)) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/bookings/${bookingId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel booking');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
      setPending(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={cancelBooking}
        disabled={pending}
        className="text-sm font-semibold text-orange-deep hover:underline disabled:opacity-50"
      >
        {pending ? 'Cancelling…' : 'Cancel booking'}
      </button>
      {error && <p className="mt-1 text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
