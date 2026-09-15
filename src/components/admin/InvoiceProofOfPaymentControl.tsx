'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { TextInput } from '@/components/forms/FormField';

/** Proof of payment can arrive as a photo (uploaded straight to blob storage) or as a pasted
 * Google Drive link — both end up as the same proof_of_payment_url column, so this renders
 * whichever entry method the admin picks rather than forcing one. */
export default function InvoiceProofOfPaymentControl({
  invoiceId,
  initialUrl,
}: {
  invoiceId: number;
  initialUrl: string | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [mode, setMode] = useState<'closed' | 'link'>('closed');
  const [linkInput, setLinkInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function attach(proofOfPaymentUrl: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/proof-of-payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofOfPaymentUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setUrl(proofOfPaymentUrl);
      setMode('closed');
      setLinkInput('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await upload(`invoices/${invoiceId}/proof-of-payment/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/invoices/upload',
      });
      await attach(blob.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function saveLink() {
    if (!linkInput.trim()) return;
    setSaving(true);
    try {
      await attach(linkInput.trim());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-teal-deep underline">
          View proof of payment
        </a>
      )}

      {mode === 'closed' && (
        <>
          <label className="cursor-pointer text-xs font-semibold text-teal-deep hover:underline">
            {uploading ? 'Uploading…' : url ? 'Replace photo' : 'Upload photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <button type="button" onClick={() => setMode('link')} className="text-xs font-semibold text-teal-deep hover:underline">
            {url ? 'Replace with Drive link' : 'Paste Drive link'}
          </button>
        </>
      )}

      {mode === 'link' && (
        <div className="flex items-center gap-2">
          <TextInput
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="https://drive.google.com/..."
            className="!w-56 !py-1 !text-xs"
          />
          <button
            type="button"
            onClick={saveLink}
            disabled={saving || !linkInput.trim()}
            className="text-xs font-bold text-teal-deep hover:underline disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={() => setMode('closed')} className="text-xs text-ink-soft hover:underline">
            Cancel
          </button>
        </div>
      )}

      {error && <span className="text-xs font-semibold text-orange-deep">{error}</span>}
    </div>
  );
}
