'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

interface PreviewResult {
  mode: 'preview';
  parsed: number;
  sample: { itemType: string; title: string; author: string | null; category: string | null }[];
}

interface ImportResult {
  mode: 'import';
  parsed: number;
  inserted: number;
  skippedDuplicates: number;
}

export default function ImportLibraryItemsForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<'preview' | 'import' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  async function run(mode: 'preview' | 'import') {
    if (!file) return;
    setBusy(mode);
    setError(null);
    if (mode === 'preview') setPreview(null);
    else setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);
      const res = await fetch('/api/admin/library/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      if (mode === 'preview') setPreview(data);
      else {
        setImportResult(data);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Upload a Libib CSV export</h2>
        <p className="mt-1 text-sm text-ink-soft">
          From Libib: <em>Settings → Export Library → CSV</em>. Safe to re-run — anything already in the catalogue (same
          ISBN, or same title within the same category) is skipped rather than duplicated.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setPreview(null);
            setImportResult(null);
            setError(null);
          }}
          className="mt-4 text-sm"
        />

        <div className="mt-4 flex gap-3">
          <Button type="button" variant="ghost" onClick={() => run('preview')} disabled={!file || busy !== null}>
            {busy === 'preview' ? 'Reading…' : 'Preview (no changes)'}
          </Button>
          <Button type="button" variant="primary" onClick={() => run('import')} disabled={!file || busy !== null}>
            {busy === 'import' ? 'Importing…' : 'Import into catalogue'}
          </Button>
        </div>

        {error && <p role="alert" className="mt-4 font-semibold text-orange-deep">{error}</p>}
      </div>

      {preview && (
        <div className="rounded-md border border-teal/30 bg-aqua/30 p-6">
          <h3 className="font-display text-base font-semibold text-teal-deep">Preview (nothing saved yet)</h3>
          <p className="mt-2 text-sm text-ink">{preview.parsed} item{preview.parsed === 1 ? '' : 's'} found in this file.</p>
          {preview.sample.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1 text-sm text-ink-soft">
              {preview.sample.map((item, i) => (
                <li key={i}>
                  <span className="font-semibold text-ink">{item.title}</span>
                  {item.author && ` — ${item.author}`}
                  {item.category && ` (${item.category})`}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {importResult && (
        <div className="rounded-md border border-teal/30 bg-aqua/30 p-6">
          <h3 className="font-display text-base font-semibold text-teal-deep">Import complete</h3>
          <ul className="mt-2 text-sm text-ink">
            <li>{importResult.inserted} new item{importResult.inserted === 1 ? '' : 's'} added to the catalogue</li>
            <li>{importResult.skippedDuplicates} already in the catalogue, skipped</li>
          </ul>
        </div>
      )}
    </div>
  );
}
