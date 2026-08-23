'use client';

import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';

/** Photo upload for a revenue/expense receipt — shows a thumbnail immediately from the local
 * file (before the upload even starts, let alone finishes), unlike PhotoUploadField which only
 * shows a thumbnail once the URL comes back. `capture="environment"` prompts the back camera
 * directly on a phone, matching "capture on mobile" from the brief; desktop just gets a normal
 * file picker since the attribute is ignored there. */
export default function ReceiptUploadField({ label = 'Proof of payment', onUploaded }: { label?: string; onUploaded: (url: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);
    setError(null);
    try {
      const blob = await upload(`budget-receipts/${Date.now()}-${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/budget/upload',
      });
      onUploaded(blob.url);
    } catch (err) {
      // The photo failing to save must never block saving the rest of the entry — surfaced as a
      // dismissable warning, not a blocking error, and onUploaded(null) so the parent form still
      // knows to submit without a receipt_url rather than silently keeping a stale one.
      setError('Photo could not be uploaded, but you can still save this entry without it.');
      onUploaded(null);
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    onUploaded(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="flex items-center gap-3">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob: preview, next/image can't optimize it
        <img src={previewUrl} alt="Receipt preview" className="h-20 w-20 rounded-sm border border-sand-line object-cover" />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-sm border border-dashed border-sand-line text-center text-[10px] text-ink-soft">
          No photo yet
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="cursor-pointer text-sm font-semibold text-teal-deep hover:underline">
          {uploading ? 'Uploading…' : previewUrl ? 'Replace photo' : `Add ${label.toLowerCase()}`}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {previewUrl && !uploading && (
          <button type="button" onClick={clear} className="text-left text-xs text-ink-soft hover:underline">
            Remove
          </button>
        )}
        {error && <span className="max-w-[14rem] text-xs font-semibold text-orange-deep">{error}</span>}
      </div>
    </div>
  );
}
