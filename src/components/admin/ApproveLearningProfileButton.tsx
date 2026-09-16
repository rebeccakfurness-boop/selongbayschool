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

  async function toggle() {
    setSaving(true);
    try {
      await fetch(`/api/admin/learning-profiles/${profileId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status === 'approved' ? 'draft' : 'approved' }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <button type="button" onClick={toggle} disabled={saving} className="text-xs font-semibold text-teal-deep hover:underline disabled:opacity-50">
      {saving ? 'Saving…' : status === 'approved' ? 'Revert to draft' : 'Approve'}
    </button>
  );
}
