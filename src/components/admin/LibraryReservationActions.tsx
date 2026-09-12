'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LibraryReservationActions({ reservationId, readyForPickup }: { reservationId: number; readyForPickup: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(path: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'That action failed.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That action failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex flex-wrap gap-3">
        {readyForPickup && (
          <button
            type="button"
            onClick={() => call(`/api/admin/library/reservations/${reservationId}/fulfill`)}
            disabled={busy}
            className="whitespace-nowrap rounded-full bg-teal px-3 py-1 text-xs font-bold text-white hover:bg-teal-deep disabled:opacity-50"
          >
            Hand over
          </button>
        )}
        <button
          type="button"
          onClick={() => call(`/api/admin/library/reservations/${reservationId}/cancel`)}
          disabled={busy}
          className="text-xs font-semibold text-ink-soft hover:text-orange-deep hover:underline disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
