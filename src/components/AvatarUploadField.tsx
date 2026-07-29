'use client';

import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import ChildAvatar from '@/components/ChildAvatar';

export default function AvatarUploadField({
  childId,
  currentUrl,
  name,
  uploadEndpoint,
  onUploaded,
}: {
  childId: number;
  currentUrl: string | null;
  name: string;
  /** e.g. /api/admin/children/upload?kind=avatar or /api/account/children/{id}/upload?kind=avatar */
  uploadEndpoint: string;
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
      const blob = await upload(`children/${childId}/avatar/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: uploadEndpoint,
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
      <ChildAvatar photoUrl={currentUrl} name={name} size="lg" />
      <div className="flex flex-col gap-1">
        <label className="cursor-pointer text-sm font-semibold text-teal-deep hover:underline">
          {uploading ? 'Uploading…' : currentUrl ? 'Change photo' : 'Add photo'}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {error && <span className="text-xs font-semibold text-orange-deep">{error}</span>}
      </div>
    </div>
  );
}
