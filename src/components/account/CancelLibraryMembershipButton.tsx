'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CancelLibraryMembershipButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account/library/cancel', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not cancel your membership.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel your membership.');
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="text-sm font-semibold text-ink-soft underline hover:text-orange-deep">
        Cancel membership
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-soft">
        You&apos;ll stop being billed monthly, but any items already borrowed still need to be returned on time.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={cancel}
          disabled={loading}
          className="text-sm font-bold text-orange-deep underline disabled:opacity-50"
        >
          {loading ? 'Cancelling…' : 'Yes, cancel'}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="text-sm font-semibold text-ink-soft underline">
          Never mind
        </button>
      </div>
      {error && <p className="text-sm font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
