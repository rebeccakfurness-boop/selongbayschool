'use client';

import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';

export default function DocumentUploadField({
  currentUrl,
  pathPrefix,
  label,
  onUploaded,
  uploadEndpoint = '/api/admin/lms/upload',
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
}: {
  currentUrl: string | null;
  pathPrefix: string;
  label: string;
  onUploaded: (url: string) => void;
  /** Defaults to the shared admin+teacher LMS upload route; callers pass a different route for
   * more restricted uploads — e.g. the Child Card's immigration-documents section passes the
   * admin-only /api/admin/children/upload, and the parent portal passes its own
   * /api/account/children/[id]/upload (ownership-checked, scoped to that one child). */
  uploadEndpoint?: string;
  /** Narrows the file picker's own filter -- e.g. the Course Builder passes "application/pdf" for
   * its syllabus/workbook uploads. Purely a UI nicety; the upload route's own allowedContentTypes
   * is what actually enforces the real restriction. */
  accept?: string;
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
        handleUploadUrl: uploadEndpoint,
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
          accept={accept}
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && <span className="text-xs font-semibold text-orange-deep">{error}</span>}
    </div>
  );
}
