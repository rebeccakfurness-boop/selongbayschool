'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Retries the automatic Family Board linking an enrolment submission's own automatic attempt
 * (inside submitEnrolment) may have failed at -- see linkEnrolmentToFamily's comment in
 * src/lib/enrolments.ts for why this is safe to click even more than once. */
export default function LinkEnrolmentButton({ enrolmentId }: { enrolmentId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function link() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/enrolments/${enrolmentId}/link-family`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to link');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link');
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={link}
        disabled={loading}
        className="whitespace-nowrap rounded-full bg-orange-deep px-3 py-1 text-xs font-bold text-white hover:bg-orange disabled:opacity-50"
      >
        {loading ? 'Linking…' : 'Link to Family Board'}
      </button>
      {error && <span className="text-xs font-semibold text-orange-deep">{error}</span>}
    </div>
  );
}
