'use client';

import { useRef, useState } from 'react';
import { TextInput } from '@/components/forms/FormField';
import Button from '@/components/Button';
import SignaturePad, { type SignaturePadHandle } from '@/components/SignaturePad';
import { formatDate } from '@/lib/admin-format';

export default function ComplianceFormModal({
  childId,
  formKey,
  label,
  signed,
  signedDate,
  defaultEmail,
  canEdit,
  onClose,
  onChanged,
}: {
  childId: number;
  formKey: string;
  label: string;
  signed: boolean;
  signedDate: string | null;
  defaultEmail: string;
  canEdit: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const padRef = useRef<SignaturePadHandle>(null);
  const [signedByName, setSignedByName] = useState('');
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  const [clearing, setClearing] = useState(false);

  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<'sent' | 'error' | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const pdfUrl = `/api/admin/compliance/${childId}/${formKey}/pdf`;

  async function saveSignature() {
    setSignError(null);
    if (!signedByName.trim()) {
      setSignError('Enter the name of the person signing.');
      return;
    }
    if (padRef.current?.isEmpty()) {
      setSignError('Draw a signature first.');
      return;
    }
    setSigning(true);
    try {
      const res = await fetch(`/api/admin/compliance/${childId}/${formKey}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedByName, signatureDataUrl: padRef.current!.toDataUrl() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save signature');
      onChanged();
    } catch (err) {
      setSignError(err instanceof Error ? err.message : 'Failed to save signature');
    } finally {
      setSigning(false);
    }
  }

  async function clearSignature() {
    setClearing(true);
    setSignError(null);
    try {
      const res = await fetch(`/api/admin/compliance/${childId}/${formKey}/sign`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to clear signature');
      onChanged();
    } catch (err) {
      setSignError(err instanceof Error ? err.message : 'Failed to clear signature');
    } finally {
      setClearing(false);
    }
  }

  async function sendToParent() {
    setSending(true);
    setSendResult(null);
    setSendError(null);
    try {
      const res = await fetch(`/api/admin/compliance/${childId}/${formKey}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setSendResult('sent');
    } catch (err) {
      setSendResult('error');
      setSendError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-md border border-sand-line bg-paper p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">{label}</h3>
            <p className={`mt-1 text-xs font-bold ${signed ? 'text-teal-deep' : 'text-orange-deep'}`}>
              {signed ? `Signed${signedDate ? ` ${formatDate(signedDate)}` : ''}` : 'Not signed'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-ink-soft hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-semibold text-teal-deep underline"
        >
          View / download PDF
        </a>

        {canEdit && (
          <>
            <div className="mt-6 border-t border-sand-line pt-4">
              <h4 className="text-sm font-bold text-ink">{signed ? 'Re-sign this form' : 'Sign this form'}</h4>
              <div className="mt-2">
                <TextInput
                  value={signedByName}
                  onChange={(e) => setSignedByName(e.target.value)}
                  placeholder="Name of person signing"
                  className="!w-full"
                />
              </div>
              <div className="mt-2">
                <SignaturePad ref={padRef} />
              </div>
              {signError && <p className="mt-2 text-xs font-semibold text-orange-deep">{signError}</p>}
              <div className="mt-3 flex flex-wrap gap-3">
                <Button type="button" variant="primary" onClick={saveSignature} disabled={signing}>
                  {signing ? 'Saving…' : 'Save signature'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => padRef.current?.clear()} disabled={signing}>
                  Clear pad
                </Button>
                {signed && (
                  <Button type="button" variant="ghost" onClick={clearSignature} disabled={clearing}>
                    {clearing ? 'Removing…' : 'Remove saved signature'}
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-sand-line pt-4">
              <h4 className="text-sm font-bold text-ink">Send to parent</h4>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <TextInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@email.com"
                  className="!w-64"
                />
                <Button type="button" variant="ghost" onClick={sendToParent} disabled={sending || !email.trim()}>
                  {sending ? 'Sending…' : 'Send'}
                </Button>
              </div>
              {sendResult === 'sent' && <p className="mt-2 text-xs font-semibold text-teal-deep">Sent ✓</p>}
              {sendResult === 'error' && <p className="mt-2 text-xs font-semibold text-orange-deep">{sendError}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
