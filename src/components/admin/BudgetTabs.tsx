'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function BudgetTabs({ active }: { active: 'dashboard' | 'revenue' | 'expenses' | 'setup' | 'transactions' }) {
  const router = useRouter();
  const [locking, setLocking] = useState(false);
  const tabs = [
    { key: 'dashboard', href: '/admin/budget', label: 'Dashboard' },
    { key: 'revenue', href: '/admin/budget/revenue', label: 'Log Revenue' },
    { key: 'expenses', href: '/admin/budget/expenses', label: 'Log Expense' },
    { key: 'setup', href: '/admin/budget/setup', label: 'Budget Setup' },
    { key: 'transactions', href: '/admin/budget/transactions', label: 'Transaction Log' },
  ] as const;

  async function lock() {
    setLocking(true);
    await fetch('/api/admin/budget/lock', { method: 'POST' });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active === tab.key ? 'bg-teal text-white' : 'border border-sand-line bg-paper text-ink hover:border-teal'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <button type="button" onClick={lock} disabled={locking} className="text-sm font-semibold text-ink-soft hover:underline disabled:opacity-50">
        {locking ? 'Locking…' : 'Lock'}
      </button>
    </div>
  );
}
