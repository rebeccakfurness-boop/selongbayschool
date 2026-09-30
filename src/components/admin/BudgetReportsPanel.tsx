'use client';

import { useState } from 'react';

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function BudgetReportsPanel({ termLabel }: { termLabel: string }) {
  const [month, setMonth] = useState(currentMonthValue());

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Financial reports</h2>
        <div className="mt-4 flex flex-col gap-6">
          <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <h3 className="font-display text-lg font-semibold text-ink">Monthly report</h3>
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
                href={`/api/admin/budget/report?report=financial&type=month&month=${month}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-teal px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-deep"
              >
                Download monthly report (PDF)
              </a>
            </div>
          </div>

          <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
            <h3 className="font-display text-lg font-semibold text-ink">School term report</h3>
            <p className="mt-1 text-sm text-ink-soft">
              The same figures across the whole active term ({termLabel}) set in Budget Setup, plus a month-by-month
              breakdown — the one to bring to the Yayasan board meeting.
            </p>
            <div className="mt-4">
              <a
                href="/api/admin/budget/report?report=financial&type=term"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-teal px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-deep"
              >
                Download term report (PDF)
              </a>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold text-ink">School operations report</h2>
        <p className="mt-1 text-sm text-ink-soft">
          New enquiries, admissions leads, bookings, new student enrolments, and current headcount -- the
          non-financial side of the same board pack.
        </p>
        <div className="mt-4 rounded-md border border-sand-line bg-paper p-6 shadow-soft">
          <div className="flex flex-wrap items-end gap-3">
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
              href={`/api/admin/budget/report?report=operations&type=month&month=${month}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-teal px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-deep"
            >
              Download monthly report (PDF)
            </a>
            <a
              href="/api/admin/budget/report?report=operations&type=term"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-teal px-5 py-2.5 text-sm font-bold text-teal-deep hover:bg-teal hover:text-white"
            >
              Download term report (PDF)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
