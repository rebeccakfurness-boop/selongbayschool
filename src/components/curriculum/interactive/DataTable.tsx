import type { DataTableStep } from '@/lib/interactive-content-types';

export default function DataTable({ step }: { step: DataTableStep }) {
  return (
    <div>
      {step.title && <h2 className="font-display text-2xl font-bold text-ink">{step.title}</h2>}
      <div className="mt-4 overflow-x-auto rounded-md border border-sand-line bg-white">
        <table className="w-full min-w-[360px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand-line bg-sand/40 text-left">
              {step.columns.map((col) => (
                <th key={col} className="px-4 py-2.5 font-bold text-ink-soft">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {step.rows.map((row, i) => (
              <tr key={i} className="border-b border-sand-line/60 last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2.5 text-ink">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
