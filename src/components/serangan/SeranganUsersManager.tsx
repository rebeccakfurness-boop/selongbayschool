'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';
import { formatDate } from '@/lib/admin-format';

export interface SeranganUserRow {
  id: number;
  email: string;
  display_name: string | null;
  role: 'admin' | 'staff';
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

/** Only an 'admin' (Shaun, Elizabeth) ever reaches this page -- see requireSeranganAdmin on
 * /serangan/users/page.tsx. A new account defaults to 'staff' (least privilege): it can log
 * weekly entries and expenses but never sees budgets, bank statements, donations, or the overall
 * transaction history (see requireSeranganAdminApi in lib/current-serangan.ts). */
export default function SeranganUsersManager({ initial, currentUserId }: { initial: SeranganUserRow[]; currentUserId: number }) {
  const [users, setUsers] = useState(initial);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTempPassword, setNewTempPassword] = useState<{ email: string; password: string } | null>(null);

  async function createUser() {
    setCreating(true);
    setError(null);
    setNewTempPassword(null);
    try {
      const res = await fetch('/api/serangan/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not create that account.');
      setNewTempPassword({ email, password: data.tempPassword });
      setUsers((prev) => [
        ...prev,
        { id: data.id, email, display_name: displayName || null, role, is_active: true, created_at: new Date().toISOString(), last_login_at: null },
      ]);
      setEmail('');
      setDisplayName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create that account.');
    } finally {
      setCreating(false);
    }
  }

  async function setActive(id: number, isActive: boolean) {
    setError(null);
    const res = await fetch(`/api/serangan/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Could not update that account.');
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: isActive } : u)));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Add a Serangan login</h2>
        <p className="mt-1 text-xs text-ink-soft">
          A new account defaults to Staff -- can log weekly entries and expenses, but never sees budgets, bank statements, donations, or the overall
          transaction history.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <Field label="Email" htmlFor="su-email" required>
            <TextInput id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Name (optional)" htmlFor="su-name">
            <TextInput id="su-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </Field>
          <Field label="Role" htmlFor="su-role">
            <select
              id="su-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}
              className="w-full rounded-sm border border-sand-line bg-white px-4 py-2.5 text-[15px] text-ink"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin (full access)</option>
            </select>
          </Field>
          <div className="flex items-end">
            <Button type="button" variant="primary" onClick={createUser} disabled={creating || !email.trim()}>
              {creating ? 'Creating…' : 'Create account'}
            </Button>
          </div>
        </div>
        {error && <p className="mt-3 font-semibold text-orange-deep">{error}</p>}
        {newTempPassword && (
          <p className="mt-4 rounded-md border border-teal/30 bg-aqua/50 px-4 py-3 text-sm text-teal-deep">
            Account created for <strong>{newTempPassword.email}</strong>. Temporary password (shown once, copy it now):{' '}
            <code className="rounded bg-white px-2 py-0.5 font-bold">{newTempPassword.password}</code>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <div key={u.id} className={`flex items-center justify-between gap-3 rounded-md border border-sand-line bg-paper p-4 text-sm ${u.is_active ? '' : 'opacity-60'}`}>
            <div>
              <p className="font-semibold text-ink">
                {u.display_name || u.email}{' '}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${u.role === 'admin' ? 'bg-teal/15 text-teal-deep' : 'bg-ink/10 text-ink-soft'}`}>
                  {u.role === 'admin' ? 'Admin' : 'Staff'}
                </span>
                {!u.is_active && <span className="ml-2 rounded-full bg-orange/20 px-2 py-0.5 text-xs font-bold text-orange-deep">Deactivated</span>}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                {u.email}
                {u.last_login_at && ` · Last login ${formatDate(u.last_login_at)}`}
              </p>
            </div>
            {u.id !== currentUserId && (
              <button type="button" onClick={() => setActive(u.id, !u.is_active)} className="shrink-0 text-xs font-semibold text-teal-deep hover:underline">
                {u.is_active ? 'Deactivate' : 'Reactivate'}
              </button>
            )}
          </div>
        ))}
        {users.length === 0 && <p className="text-sm text-ink-soft">No accounts yet.</p>}
      </div>
    </div>
  );
}
