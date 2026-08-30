'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import type { GenerateCurriculumTermResult } from '@/lib/curriculum-generation';

export default function CurriculumImportForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonText, setJsonText] = useState('');
  const [allowUpdatingExistingTerm, setAllowUpdatingExistingTerm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateCurriculumTermResult | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      setJsonText(await file.text());
    } catch {
      setError('Could not read that file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function runImport() {
    setError(null);
    setResult(null);

    let course: unknown;
    try {
      course = JSON.parse(jsonText);
    } catch (err) {
      setError(`That's not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    setImporting(true);
    try {
      const res = await fetch('/api/admin/curriculum/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course, allowUpdatingExistingTerm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) || 'Import failed.');
        return;
      }
      setResult(data.result as GenerateCurriculumTermResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Course JSON</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Upload a <code>.json</code> file, or paste it directly below. Top level: <code>{'{ input: { className, subject, termLabel, frameworkLabel? }, content: { parsedSyllabus, units } }'}</code> --
          the same shape a live AI-generated course produces internally. Every field is checked before anything is
          imported; a rejected file explains exactly which field and why.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="cursor-pointer text-sm font-semibold text-teal-deep hover:underline">
            Upload JSON file
            <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={onFileChange} className="hidden" />
          </label>
          {jsonText.trim() !== '' && (
            <button type="button" onClick={() => setJsonText('')} className="text-xs font-semibold text-orange-deep hover:underline">
              Clear
            </button>
          )}
        </div>

        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='{"input": {"className": "...", "subject": "...", "termLabel": "..."}, "content": {"parsedSyllabus": {...}, "units": {...}}}'
          rows={16}
          spellCheck={false}
          className="mt-3 w-full rounded-sm border border-sand-line bg-white px-4 py-2.5 font-mono text-xs text-ink placeholder:text-ink-soft/50 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        />

        <div className="mt-3 flex items-center gap-2">
          <input
            id="allow-update"
            type="checkbox"
            checked={allowUpdatingExistingTerm}
            onChange={(e) => setAllowUpdatingExistingTerm(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="allow-update" className="text-sm text-ink-soft">
            A programme for this class/subject/term already exists -- add these units to it instead of failing
          </label>
        </div>

        {error && <p className="mt-4 font-semibold text-orange-deep">{error}</p>}

        <div className="mt-4">
          <Button type="button" variant="primary" onClick={runImport} disabled={importing || jsonText.trim() === ''}>
            {importing ? 'Importing…' : 'Validate & import'}
          </Button>
        </div>
      </div>

      {result && (
        <div className="rounded-md border border-teal/30 bg-aqua/30 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-teal-deep">Imported</h2>
            <Link
              href={`/admin/teaching/curriculum-plans/${result.termId}`}
              className="rounded-full bg-teal px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-deep"
            >
              Open Planning Dashboard →
            </Link>
          </div>
          <ul className="mt-2 text-sm text-ink">
            <li>{result.unitsCreated} unit(s), {result.lessonsCreated} lesson(s) created</li>
            <li>{result.quizQuestionsCreated} quiz question(s), {result.flashcardsCreated} flashcard(s)</li>
            <li>
              Pacing: {result.pacing.sessionCount} session(s) planned (
              {result.pacing.source === 'class_schedule' ? `from the timetable, ${result.pacing.academicTermLabel}` : 'default -- no matching timetable/academic term found yet'}
              )
            </li>
          </ul>
          <p className="mt-2 text-xs text-ink-soft">
            Every lesson landed as &quot;Needs review&quot; -- nothing is visible to parents or students until a
            teacher publishes it from the Planning Dashboard.
          </p>

          {result.calculationWarnings.length > 0 && (
            <div className="mt-3 rounded-md border border-dashed border-orange/40 bg-orange/10 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-orange-deep">
                {result.calculationWarnings.length} lesson(s) have calculation/step-ordering warnings
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {result.calculationWarnings.map((w, i) => (
                  <li key={i} className="text-xs text-ink">
                    <span className="font-semibold">{w.lessonTitle}:</span> {w.warnings.join('; ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.workbookMasteryProposals.length > 0 && (
            <div className="mt-3 rounded-md border border-dashed border-teal/40 bg-white p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                Workbook suggests these topics may already be mastered (confirm before skipping)
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {result.workbookMasteryProposals.map((s, i) => (
                  <li key={i} className="text-xs text-ink">
                    <span className="font-semibold">[{s.confidence}]</span> {s.topicTitle} — {s.evidence}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
