'use client';

import { useState, type FormEvent } from 'react';
import { Field, TextInput } from '@/components/forms/FormField';
import Button from '@/components/Button';

interface ChildMatch {
  id: number;
  child_full_name: string;
  class_name: string | null;
  link_status: 'approved' | 'pending' | 'rejected' | null;
}

export default function LinkChildForm() {
  const [childFullName, setChildFullName] = useState('');
  const [dob, setDob] = useState('');
  const [relationship, setRelationship] = useState('');
  const [matches, setMatches] = useState<ChildMatch[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestedIds, setRequestedIds] = useState<Set<number>>(new Set());
  const [requestMessage, setRequestMessage] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    setSearching(true);
    setError(null);
    setMatches(null);
    try {
      const res = await fetch('/api/account/link-child/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childFullName, dob }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not search.');
      setMatches(data.matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not search.');
    } finally {
      setSearching(false);
    }
  }

  async function handleRequest(childId: number) {
    setError(null);
    setRequestMessage(null);
    try {
      const res = await fetch('/api/account/link-child/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, relationship: relationship || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send the request.');
      setRequestedIds((prev) => new Set(prev).add(childId));
      setRequestMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the request.');
    }
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold text-ink">Link a Child</h2>
      <p className="mt-1 text-xs text-ink-soft">
        Search using your child&apos;s exact full name and date of birth, as recorded with the school office. A
        request needs admin approval before the child appears in your account.
      </p>

      <form onSubmit={handleSearch} className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Child's full name" htmlFor="lc-name">
          <TextInput id="lc-name" required value={childFullName} onChange={(e) => setChildFullName(e.target.value)} />
        </Field>
        <Field label="Date of birth" htmlFor="lc-dob">
          <TextInput id="lc-dob" type="date" required value={dob} onChange={(e) => setDob(e.target.value)} />
        </Field>
        <Field label="Your relationship (optional)" htmlFor="lc-relationship">
          <TextInput id="lc-relationship" placeholder="e.g. Mother" value={relationship} onChange={(e) => setRelationship(e.target.value)} />
        </Field>
        <div className="sm:col-span-3">
          <Button type="submit" variant="primary" disabled={searching}>
            {searching ? 'Searching…' : 'Search'}
          </Button>
        </div>
      </form>

      {error && <p role="alert" className="mt-4 font-semibold text-orange-deep">{error}</p>}
      {requestMessage && <p className="mt-4 rounded-md border border-teal/30 bg-aqua/50 px-4 py-3 text-sm font-semibold text-teal-deep">{requestMessage}</p>}

      {matches && (
        <div className="mt-4 flex flex-col gap-2">
          {matches.length === 0 && <p className="text-sm text-ink-soft">No matching student found. Double-check the name and date of birth.</p>}
          {matches.map((m) => {
            const requested = requestedIds.has(m.id) || m.link_status === 'pending';
            const approved = m.link_status === 'approved';
            return (
              <div key={m.id} className="flex items-center justify-between rounded-sm border border-sand-line px-4 py-3 text-sm">
                <span>
                  <span className="font-semibold text-ink">{m.child_full_name}</span>
                  {m.class_name && <span className="ml-2 text-xs text-ink-soft">{m.class_name}</span>}
                </span>
                {approved ? (
                  <span className="text-xs font-bold text-teal-deep">Already linked</span>
                ) : requested ? (
                  <span className="text-xs font-bold text-ink-soft">Request pending</span>
                ) : (
                  <Button type="button" variant="ghost" onClick={() => handleRequest(m.id)}>
                    Request link
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
