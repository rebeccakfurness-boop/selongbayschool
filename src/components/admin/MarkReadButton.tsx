'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function MarkReadButton({
  id,
  isRead,
  endpoint = '/api/admin/enquiries',
}: {
  id: number;
  isRead: boolean;
  /** Base path for the PATCH request, e.g. '/api/admin/enrolments'. Defaults to enquiries for existing callers. */
  endpoint?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      await fetch(`${endpoint}/${id}`, {
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
