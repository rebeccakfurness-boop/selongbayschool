'use client';

import { useState } from 'react';

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
function currentQuarterValue(): string {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${q}`;
}
function currentYearValue(): string {
  return String(new Date().getFullYear());
}

export default function SeranganReportsPanel() {
  const [month, setMonth] = useState(currentMonthValue());
  const [quarter, setQuarter] = useState(currentQuarterValue());
  const [year, setYear] = useState(currentYearValue());

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h3 className="font-display text-lg font-semibold text-ink">Monthly report</h3>
        <p className="mt-1 text-sm text-ink-soft">Sessions, attendance, donations, and expenditure for a single calendar month.</p>
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
            href={`/api/serangan/report?type=month&month=${month}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-teal px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-deep"
          >
            Download monthly report (PDF)
          </a>
        </div>
      </div>

      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h3 className="font-display text-lg font-semibold text-ink">Quarterly report</h3>
        <p className="mt-1 text-sm text-ink-soft">The same figures across a full calendar quarter.</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">Quarter</span>
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              className="rounded-sm border border-sand-line bg-white px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              {[0, -1, -2].flatMap((yearOffset) => {
                const y = new Date().getFullYear() + yearOffset;
                return [4, 3, 2, 1].map((q) => (
                  <option key={`${y}-Q${q}`} value={`${y}-Q${q}`}>
                    Q{q} {y}
                  </option>
                ));
              })}
            </select>
          </label>
          <a
            href={`/api/serangan/report?type=quarter&quarter=${quarter}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-teal px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-deep"
          >
            Download quarterly report (PDF)
          </a>
        </div>
      </div>

      <div className="rounded-md border border-sand-line bg-paper p-6 shadow-soft">
        <h3 className="font-display text-lg font-semibold text-ink">Yearly report</h3>
        <p className="mt-1 text-sm text-ink-soft">The full calendar year -- the one to use when reporting back to donors or the Yayasan board.</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">Year</span>
            <input
              type="number"
              min={2000}
              max={2100}
              step={1}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-28 rounded-sm border border-sand-line bg-white px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            />
          </label>
          <a
            href={`/api/serangan/report?type=year&year=${year}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-teal px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-deep"
          >
            Download yearly report (PDF)
          </a>
        </div>
      </div>
    </div>
  );
}
