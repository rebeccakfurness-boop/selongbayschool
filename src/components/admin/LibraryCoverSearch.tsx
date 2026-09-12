'use client';

import Image from 'next/image';
import { useState } from 'react';
import { TextInput } from '@/components/forms/FormField';

interface CoverCandidate {
  title: string | null;
  author: string | null;
  isbn: string | null;
  photoUrl: string | null;
}

/** Companion to the "Look up by ISBN or title" field — that one commits to a single best-guess
 * match; this shows a gallery of candidate covers by title (different editions of the same book
 * often have quite different cover art) so the admin can pick the one that actually matches the
 * copy on the shelf, by eye, instead of accepting whatever came back first. */
export default function LibraryCoverSearch({ onSelect }: { onSelect: (photoUrl: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CoverCandidate[] | null>(null);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    setCandidates(null);
    try {
      const res = await fetch(`/api/admin/library/lookup-book?covers=true&q=${encodeURIComponent(query.trim())}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not search for covers.');
      setCandidates(data.candidates ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not search for covers.');
    } finally {
      setSearching(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-teal-deep hover:underline">
        Search for a cover by title
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-sm border border-sand-line bg-sand/30 p-3">
      <div className="flex flex-wrap gap-2">
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              search();
            }
          }}
          placeholder="Book title"
          className="max-w-xs"
        />
        <button
          type="button"
          onClick={search}
          disabled={searching || !query.trim()}
          className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal-deep disabled:opacity-50"
        >
          {searching ? 'Searching…' : 'Search'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-ink-soft underline">
          Close
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
      {candidates && candidates.length === 0 && <p className="mt-2 text-xs text-ink-soft">No covers found for that title.</p>}
      {candidates && candidates.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {candidates.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => c.photoUrl && onSelect(c.photoUrl)}
              className="flex flex-col items-center gap-1 rounded-sm p-1 text-left hover:bg-white"
              title={[c.title, c.author].filter(Boolean).join(' — ')}
            >
              <div className="relative h-20 w-14 overflow-hidden rounded-sm border border-sand-line bg-white">
                {c.photoUrl && <Image src={c.photoUrl} alt={c.title || ''} fill sizes="56px" className="object-cover" />}
              </div>
              <span className="line-clamp-2 text-[10px] leading-tight text-ink-soft">{c.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
