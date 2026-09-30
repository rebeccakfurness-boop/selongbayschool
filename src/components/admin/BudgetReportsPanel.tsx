'use client';

import { useState } from 'react';

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function BudgetReportsPanel({ termLabel }: { termLabel: string }) {
  const [month, setMonth] = useState(currentMonthValue());

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">Monthly report</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Revenue, expenses, and category spend vs. budget for a single calendar month.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">Month</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-sm border border-sand-line bg-white px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </label>
          <a
            href={`/api/admin/budget/report?type=month&month=${month}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-teal px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-deep"
          >
            Download monthly report (PDF)
          </a>
        </div>
      </div>

      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold text-ink">School term report</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The same figures across the whole active term ({termLabel}) set in Budget Setup, plus a month-by-month
          breakdown — the one to bring to the Yayasan board meeting.
        </p>
        <div className="mt-4">
          <a
            href="/api/admin/budget/report?type=term"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-teal px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-deep"
          >
            Download term report (PDF)
          </a>
        </div>
      </div>
    </div>
  );
}
