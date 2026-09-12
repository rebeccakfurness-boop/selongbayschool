'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LibraryLoanActions({
  loanId,
  returned,
  hasFee,
  feeWaived,
  feeInvoiced,
  dueSoonEmailSent,
}: {
  loanId: number;
  returned: boolean;
  hasFee: boolean;
  feeWaived: boolean;
  feeInvoiced: boolean;
  dueSoonEmailSent: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminderSent, setReminderSent] = useState(false);

  async function call(path: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'That action failed.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That action failed.');
    } finally {
      setBusy(false);
    }
  }

  async function sendReminder() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/library/loans/${loanId}/send-reminder`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send this reminder.');
      setReminderSent(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send this reminder.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex flex-wrap items-center gap-3">
        {!returned && (
          <button
            type="button"
            onClick={() => call(`/api/admin/library/loans/${loanId}/return`)}
            disabled={busy}
            className="whitespace-nowrap rounded-full bg-teal px-3 py-1 text-xs font-bold text-white hover:bg-teal-deep disabled:opacity-50"
          >
            Mark returned
          </button>
        )}
        {!returned && (
          <button
            type="button"
            onClick={sendReminder}
            disabled={busy}
            className="whitespace-nowrap text-xs font-semibold text-teal-deep hover:underline disabled:opacity-50"
          >
            {dueSoonEmailSent || reminderSent ? 'Resend reminder' : 'Send reminder'}
          </button>
        )}
        {returned && hasFee && !feeWaived && !feeInvoiced && (
          <>
            <button
              type="button"
              onClick={() => call(`/api/admin/library/loans/${loanId}/charge-fee`)}
              disabled={busy}
              className="whitespace-nowrap rounded-full bg-orange-deep px-3 py-1 text-xs font-bold text-white hover:bg-orange disabled:opacity-50"
            >
              Charge late fee
            </button>
            <button
              type="button"
              onClick={() => call(`/api/admin/library/loans/${loanId}/waive`)}
              disabled={busy}
              className="text-xs font-semibold text-ink-soft hover:underline disabled:opacity-50"
            >
              Waive
            </button>
          </>
        )}
      </div>
      {error && <p className="text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
