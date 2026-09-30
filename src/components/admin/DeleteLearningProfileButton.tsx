'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Mirrors DeleteInvoiceButton's shape -- permanent, admin-only (the route itself re-checks this),
 * confirmed via a plain browser confirm() since this is a rare, destructive action, not something
 * that needs a richer modal. */
export default function DeleteLearningProfileButton({ profileId, termLabel }: { profileId: number; termLabel: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function deleteProfile() {
    if (!window.confirm(`Permanently delete the ${termLabel} report? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/learning-profiles/${profileId}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        window.alert(body?.error || 'Could not delete report.');
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button type="button" onClick={deleteProfile} disabled={deleting} className="text-xs font-semibold text-orange-deep hover:underline disabled:opacity-50">
      {deleting ? 'Deleting…' : 'Delete'}
    </button>
  );
}
