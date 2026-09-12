'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import { formatDateTime } from '@/lib/admin-format';

interface StudentAccountSummary {
  username: string;
  created_at: string;
  last_login_at: string | null;
}

/** Self-fetching, same reason as AttendanceSection -- admin-only (see the API routes) so a
 * teacher viewing a Child Card simply never sees a populated panel here (the GET 403s silently
 * into "couldn't load", same as any other admin-only section would if reused outside its role). */
export default function StudentLoginSection({ childId }: { childId: number }) {
  const [account, setAccount] = useState<StudentAccountSummary | null | undefined>(undefined);
  const [username, setUsername] = useState('');
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/children/${childId}/student-account`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        setAccount(ok ? (data.account ?? null) : null);
      });
    return () => {
      cancelled = true;
    };
  }, [childId]);

  async function create() {
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/children/${childId}/student-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not create a student login.');
      setAccount({ username: username.trim(), created_at: new Date().toISOString(), last_login_at: null });
      setTempPassword(data.tempPassword);
      setUsername('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create a student login.');
    } finally {
      setCreating(false);
    }
  }

  async function resetPassword() {
    setResetting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/children/${childId}/student-account/reset-password`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not reset this password.');
      setTempPassword(data.tempPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset this password.');
    } finally {
      setResetting(false);
    }
  }

  if (account === undefined) {
    return null;
  }

  return (
    <div className="rounded-md border border-sand-line bg-paper p-5 shadow-soft">
      <h3 className="font-display text-base font-semibold text-teal-deep">Student Login</h3>
      <p className="mt-1 text-xs text-ink-soft">Lets this student log in themselves at /student/login to see their schedule and complete online lessons.</p>

      {tempPassword && (
        <div className="mt-3 rounded-md border-2 border-teal bg-teal/10 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-deep">Temporary password -- shown once</p>
          <p className="mt-1 font-mono text-lg font-bold text-ink">{tempPassword}</p>
          <p className="mt-1 text-xs text-ink-soft">
            Copy this now and give it to the student. It isn&apos;t stored anywhere and can&apos;t be shown again -- use
            &quot;Reset password&quot; below if it&apos;s lost.
          </p>
        </div>
      )}

      {account ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink">
              Username: <span className="font-semibold">{account.username}</span>
            </p>
            <p className="text-xs text-ink-soft">{account.last_login_at ? `Last logged in ${formatDateTime(account.last_login_at)}` : 'Never logged in yet'}</p>
          </div>
          <Button type="button" onClick={resetPassword} disabled={resetting}>
            {resetting ? 'Resetting…' : 'Reset password'}
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <Field label="Username" htmlFor={`student-username-${childId}`}>
            <TextInput
              id={`student-username-${childId}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. noah.f"
              className="max-w-xs"
            />
          </Field>
          <Button type="button" variant="primary" onClick={create} disabled={creating || username.trim().length < 3}>
            {creating ? 'Creating…' : 'Create login'}
          </Button>
        </div>
      )}

      {error && <p className="mt-2 text-xs font-semibold text-orange-deep">{error}</p>}
    </div>
  );
}
