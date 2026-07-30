'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MarkInvoicePaidButton({ invoiceId }: { invoiceId: number }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function markPaid() {
    setSaving(true);
    try {
      await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <button type="button" onClick={markPaid} disabled={saving} className="text-xs font-semibold text-teal-deep hover:underline disabled:opacity-50">
      {saving ? 'Saving…' : 'Mark as Paid'}
    </button>
  );
}
