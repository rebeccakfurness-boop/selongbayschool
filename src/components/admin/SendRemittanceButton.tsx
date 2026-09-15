'use client';

import { useState } from 'react';
import { TextInput } from '@/components/forms/FormField';

/** Manual-send counterpart to SendInvoiceButton, for once an invoice has been marked paid --
 * confirms payment received rather than requesting it. Deliberately never fires on its own; the
 * admin decides when (e.g. after checking the attached proof of payment). */
export default function SendRemittanceButton({
  invoiceId,
  defaultEmail,
  initiallySent,
}: {
  invoiceId: number;
  defaultEmail: string;
  initiallySent: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(initiallySent);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function send() {
    setSending(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/send-remittance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setSent(true);
      setExpanded(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  if (!expanded) {
    return (
      <button type="button" onClick={() => setExpanded(true)} className="text-xs font-semibold text-teal-deep hover:underline">
        {sent ? 'Remittance sent ✓ (send again)' : 'Send remittance note'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <TextInput
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="parent@email.com"
        className="!w-48 !py-1 !text-xs"
      />
      <button type="button" onClick={send} disabled={sending || !email.trim()} className="text-xs font-bold text-teal-deep hover:underline disabled:opacity-40">
        {sending ? 'Sending…' : 'Send'}
      </button>
      <button type="button" onClick={() => setExpanded(false)} className="text-xs text-ink-soft hover:underline">
        Cancel
      </button>
      {errorMessage && <span className="text-xs font-semibold text-orange-deep">{errorMessage}</span>}
    </div>
  );
}
