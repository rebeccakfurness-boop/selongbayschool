'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Admin-only toggle between 'draft' and 'approved' — mirrors MarkInvoicePaidButton's shape.
 * Reverting an already-sent report back to draft doesn't un-send it, but does hide it from the
 * Parent Portal again (see getLearningProfilesForChild), since visibility requires both
 * status='approved' and sent_at set. */
export default function ApproveLearningProfileButton({ profileId, status }: { profileId: number; status: 'draft' | 'approved' }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/learning-profiles/${profileId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status === 'approved' ? 'draft' : 'approved' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed to update status (${res.status}).`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={toggle} disabled={saving} className="text-xs font-semibold text-teal-deep hover:underline disabled:opacity-50">
        {saving ? 'Saving…' : status === 'approved' ? 'Revert to draft' : 'Approve'}
      </button>
      {error && <span className="text-xs font-semibold text-orange-deep">{error}</span>}
    </div>
  );
}
