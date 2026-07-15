'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function MarkPaidButton({ id }: { id: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function markPaid() {
    setPending(true);
    try {
      await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={markPaid}
      disabled={pending}
      className="text-sm font-semibold text-teal-deep hover:underline disabled:opacity-50"
    >
      {pending ? 'Saving…' : 'Mark as Paid'}
    </button>
  );
}
