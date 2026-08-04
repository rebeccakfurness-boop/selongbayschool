'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VoidInvoiceButton({ invoiceId }: { invoiceId: number }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function voidInvoice() {
    if (!window.confirm('Void this invoice? It will be marked cancelled and no longer counted as outstanding, but stays on record.')) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <button type="button" onClick={voidInvoice} disabled={saving} className="text-xs font-semibold text-orange-deep hover:underline disabled:opacity-50">
      {saving ? 'Voiding…' : 'Void'}
    </button>
  );
}
