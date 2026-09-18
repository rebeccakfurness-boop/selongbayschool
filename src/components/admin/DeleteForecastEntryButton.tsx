'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteForecastEntryButton({ id }: { id: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!window.confirm('Remove this forecast line?')) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/budget/forecast/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button type="button" onClick={remove} disabled={deleting} className="text-xs font-semibold text-orange-deep hover:underline disabled:opacity-50">
      {deleting ? 'Removing…' : 'Remove'}
    </button>
  );
}
