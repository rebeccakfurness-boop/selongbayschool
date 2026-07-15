'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';

export default function PhotoUploadField({
  currentUrl,
  pathPrefix,
  onUploaded,
}: {
  currentUrl: string | null;
  pathPrefix: string;
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
        handleUploadUrl: '/api/admin/activities/upload',
      });
      onUploaded(blob.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="flex items-center gap-3">
      {currentUrl ? (
        <div className="relative h-16 w-16 overflow-hidden rounded-sm border border-sand-line">
          <Image src={currentUrl} alt="" fill sizes="64px" className="object-cover" />
        </div>
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-sm border border-dashed border-sand-line text-[10px] text-ink-soft">
          No photo
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="cursor-pointer text-sm font-semibold text-teal-deep hover:underline">
          {uploading ? 'Uploading…' : currentUrl ? 'Replace photo' : 'Upload photo'}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {error && <span className="max-w-[10rem] text-xs font-semibold text-orange-deep">{error}</span>}
      </div>
    </div>
  );
}
