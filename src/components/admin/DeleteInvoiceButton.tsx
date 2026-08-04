'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteInvoiceButton({ invoiceId, invoiceNumber }: { invoiceId: number; invoiceNumber: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function deleteInvoice() {
    const label = `#${String(invoiceNumber).padStart(3, '0')}`;
    if (!window.confirm(`Permanently delete invoice ${label}? This removes it completely and cannot be undone. If you just need to cancel it without losing the record, use Void instead.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        window.alert(body?.error || 'Could not delete invoice.');
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button type="button" onClick={deleteInvoice} disabled={deleting} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">
      {deleting ? 'Deleting…' : 'Delete'}
    </button>
  );
}
