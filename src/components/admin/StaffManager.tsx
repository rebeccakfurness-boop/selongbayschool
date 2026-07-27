'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Field, TextInput } from '@/components/forms/FormField';

export interface StaffRow {
  id: number;
  email: string;
  display_name: string | null;
  role: 'admin' | 'teacher';
  assigned_classes: string[];
}

export default function StaffManager({ initial, classOptions }: { initial: StaffRow[]; classOptions: string[] }) {
  const router = useRouter();
  const [staff, setStaff] = useState(initial);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher'>('teacher');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTempPassword, setNewTempPassword] = useState<{ email: string; password: string } | null>(null);
  const [pendingClass, setPendingClass] = useState<Record<number, string>>({});

  async function createStaff() {
    setCreating(true);
    setError(null);
    setNewTempPassword(null);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create account');
      setNewTempPassword({ email, password: data.tempPassword });
      setStaff((prev) => [...prev, { id: data.id, email, display_name: null, role, assigned_classes: [] }]);
      setEmail('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setCreating(false);
    }
  }

  async function addClass(staffId: number) {
    const className = pendingClass[staffId];
    if (!className) return;
    await fetch(`/api/admin/staff/${staffId}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ className }),
    });
    setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, assigned_classes: [...s.assigned_classes, className] } : s)));
    setPendingClass((prev) => ({ ...prev, [staffId]: '' }));
    router.refresh();
  }

  async function removeClass(staffId: number, className: string) {
    await fetch(`/api/admin/staff/${staffId}/assignments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ className }),
    });
    setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, assigned_classes: s.assigned_classes.filter((c) => c !== className) } : s)));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Create staff account</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Email" htmlFor="staff-email" required>
            <TextInput id="staff-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Role" htmlFor="staff-role">
            <select
              id="staff-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'teacher')}
              className="rounded-sm border border-sand-line bg-white px-4 py-2.5 text-[15px] text-ink"
            >
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <div className="flex items-end">
            <Button type="button" variant="primary" onClick={createStaff} disabled={creating || !email.trim()}>
              {creating ? 'Creating…' : 'Create account'}
            </Button>
          </div>
        </div>
        {error && <p className="mt-3 font-semibold text-orange-deep">{error}</p>}
        {newTempPassword && (
          <p className="mt-4 rounded-md border border-teal/30 bg-aqua/50 px-4 py-3 text-sm text-teal-deep">
            Account created for <strong>{newTempPassword.email}</strong>. Temporary password (shown once — copy it now):{' '}
            <code className="rounded bg-white px-2 py-0.5 font-bold">{newTempPassword.password}</code>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {staff.map((s) => (
          <div key={s.id} className="rounded-md border border-sand-line bg-paper p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink">{s.display_name || s.email}</span>
                <span className="ml-2 rounded-full bg-teal/10 px-2 py-0.5 text-xs font-bold capitalize text-teal-deep">{s.role}</span>
              </div>
            </div>
            {s.role === 'teacher' && (
              <div className="mt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Assigned classes</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {s.assigned_classes.map((c) => (
                    <span key={c} className="flex items-center gap-1 rounded-full bg-sand/60 px-3 py-1 text-xs font-semibold text-ink">
                      {c}
                      <button type="button" onClick={() => removeClass(s.id, c)} className="text-orange-deep hover:underline">
                        ✕
                      </button>
                    </span>
                  ))}
                  {s.assigned_classes.length === 0 && <span className="text-xs text-ink-soft">No classes assigned yet.</span>}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <select
                    value={pendingClass[s.id] ?? ''}
                    onChange={(e) => setPendingClass((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    className="rounded-sm border border-sand-line bg-white px-2 py-1 text-sm"
                  >
                    <option value="">Add a class…</option>
                    {classOptions
                      .filter((c) => !s.assigned_classes.includes(c))
                      .map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                  </select>
                  <button type="button" onClick={() => addClass(s.id)} disabled={!pendingClass[s.id]} className="text-xs font-semibold text-teal-deep hover:underline disabled:opacity-40">
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {staff.length === 0 && <p className="text-sm text-ink-soft">No staff accounts yet.</p>}
      </div>
    </div>
  );
}
