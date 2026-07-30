'use client';

import { useRef, useState } from 'react';
import Button from '@/components/Button';

interface PreviewResult {
  mode: 'preview';
  childrenParsed: number;
  enquiriesParsed: number;
  forecastParsed: number;
  enquiriesBySource: Record<string, number>;
  sampleChild: Record<string, unknown> | null;
}

interface ImportResult {
  mode: 'import';
  childrenParsed: number;
  childrenInserted: number;
  enquiriesInserted: number;
  forecastInserted: number;
  enquiriesBySource: Record<string, number>;
  rowErrors: string[];
}

export default function ImportFamilyDataForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [clearEnquiries, setClearEnquiries] = useState(false);
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
      formData.append('clearEnquiries', String(clearEnquiries));
      const res = await fetch('/api/admin/import-family', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      if (mode === 'preview') setPreview(data);
      else setImportResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Upload spreadsheet</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The real enrollment/forecast .xlsx file — expects the same tab names as the original
          (Sheet1, School Tours, Inquiries from WA, Old Inquiries, Other islanders, Visitors only, Student Count).
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setPreview(null);
            setImportResult(null);
            setError(null);
          }}
          className="mt-4 text-sm"
        />

        <div className="mt-4 flex items-center gap-2">
          <input
            id="clear-enquiries"
            type="checkbox"
            checked={clearEnquiries}
            onChange={(e) => setClearEnquiries(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="clear-enquiries" className="text-sm text-ink-soft">
            Clear existing admissions enquiries before importing (check this if you&apos;ve run an import before —
            enquiries have no de-duplication and would otherwise be duplicated)
          </label>
        </div>

        <div className="mt-4 flex gap-3">
          <Button type="button" variant="ghost" onClick={() => run('preview')} disabled={!file || busy !== null}>
            {busy === 'preview' ? 'Reading…' : 'Preview (no changes)'}
          </Button>
          <Button type="button" variant="primary" onClick={() => run('import')} disabled={!file || busy !== null}>
            {busy === 'import' ? 'Importing…' : 'Import into database'}
          </Button>
        </div>

        {error && <p role="alert" className="mt-4 font-semibold text-orange-deep">{error}</p>}
      </div>

      {preview && (
        <div className="rounded-md border border-teal/30 bg-aqua/30 p-6">
          <h3 className="font-display text-base font-semibold text-teal-deep">Preview — nothing saved yet</h3>
          <ul className="mt-2 text-sm text-ink">
            <li>{preview.childrenParsed} students found in Sheet1</li>
            <li>
              {preview.enquiriesParsed} admissions enquiries found ({Object.entries(preview.enquiriesBySource).map(([s, c]) => `${s}: ${c}`).join(', ')})
            </li>
            <li>{preview.forecastParsed} class forecast entries found</li>
          </ul>
          {preview.sampleChild && (
            <pre className="mt-3 overflow-x-auto rounded-sm bg-white p-3 text-xs text-ink-soft">
              {JSON.stringify(preview.sampleChild, null, 2)}
            </pre>
          )}
        </div>
      )}

      {importResult && (
        <div className="rounded-md border border-teal/30 bg-aqua/30 p-6">
          <h3 className="font-display text-base font-semibold text-teal-deep">Import complete</h3>
          <ul className="mt-2 text-sm text-ink">
            <li>
              {importResult.childrenInserted} new children added (skipped {importResult.childrenParsed - importResult.childrenInserted} already
              on file, matched by name + date of birth)
            </li>
            <li>
              {importResult.enquiriesInserted} admissions enquiries added ({Object.entries(importResult.enquiriesBySource).map(([s, c]) => `${s}: ${c}`).join(', ')})
            </li>
            <li>{importResult.forecastInserted} class forecast entries (fully replaced)</li>
          </ul>
        </div>
      )}

      {importResult && importResult.rowErrors.length > 0 && (
        <div className="rounded-md border border-orange/30 bg-orange/10 p-6">
          <h3 className="font-display text-base font-semibold text-orange-deep">
            {importResult.rowErrors.length} row{importResult.rowErrors.length === 1 ? '' : 's'} skipped
          </h3>
          <p className="mt-1 text-sm text-ink-soft">Everything else imported fine — these specific rows had bad data and were skipped:</p>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-ink">
            {importResult.rowErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
