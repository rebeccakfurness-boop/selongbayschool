import type { DataTableStep } from '@/lib/interactive-content-types';

/** Matches buildDataTable, including its optional highlighted "best" row (e.g. the
 * profit-maximising output row in a cost/revenue table). */
export default function DataTable({ step }: { step: DataTableStep }) {
  return (
    <div className="overflow-x-auto rounded-md border border-sand-line bg-white">
      <table className="w-full min-w-[360px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-sand-line bg-ink text-left text-white">
            {step.columns.map((col) => (
              <th key={col} className="px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wide">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {step.rows.map((row, i) => (
            <tr key={i} className={`border-b border-sand-line/60 last:border-0 ${i === step.highlightRowIndex ? 'bg-orange/20 font-bold' : ''}`}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 font-mono text-ink">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
