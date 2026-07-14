'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function MarkReadButton({ id, isRead }: { id: number; isRead: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !isRead }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="text-sm font-semibold text-teal-deep hover:underline disabled:opacity-50"
    >
      {isRead ? 'Mark unread' : 'Mark read'}
    </button>
  );
}
