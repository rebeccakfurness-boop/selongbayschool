'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LibraryDiscountCodeActions({ codeId, isActive }: { codeId: number; isActive: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await fetch(`/api/admin/library/discount-codes/${codeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm('Delete this discount code? It will no longer be redeemable.')) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/library/discount-codes/${codeId}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-3">
      <button type="button" onClick={toggle} disabled={busy} className="text-xs font-semibold text-teal-deep hover:underline disabled:opacity-50">
        {isActive ? 'Deactivate' : 'Reactivate'}
      </button>
      <button type="button" onClick={remove} disabled={busy} className="text-xs font-semibold text-ink-soft hover:text-orange-deep hover:underline disabled:opacity-50">
        Delete
      </button>
    </div>
  );
}
