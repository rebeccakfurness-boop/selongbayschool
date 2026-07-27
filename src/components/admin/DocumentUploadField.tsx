'use client';

import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';

export default function DocumentUploadField({
  currentUrl,
  pathPrefix,
  label,
  onUploaded,
}: {
  currentUrl: string | null;
  pathPrefix: string;
  label: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await upload(`${pathPrefix}/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/children/upload',
      });
      onUploaded(blob.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="flex items-center gap-3">
      {currentUrl && (
        <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-teal-deep underline">
          View {label.toLowerCase()}
        </a>
      )}
      <label className="cursor-pointer text-sm font-semibold text-teal-deep hover:underline">
        {uploading ? 'Uploading…' : currentUrl ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && <span className="text-xs font-semibold text-orange-deep">{error}</span>}
    </div>
  );
}
