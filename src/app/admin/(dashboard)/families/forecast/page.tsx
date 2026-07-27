import { ensureSchema, sql } from '@/lib/db';
import { CLASS_BAND_LABELS, CLASS_BAND_ORDER, type ClassBand } from '@/lib/family-data';

export const dynamic = 'force-dynamic';

interface ForecastRow {
  forecast_month: string;
  class_band: ClassBand;
  child_display_name: string;
  age_or_grade_label: string | null;
  status_tag: string | null;
}

export default async function ClassForecastPage() {
  await ensureSchema();
  const rows = (await sql`
    SELECT forecast_month, class_band, child_display_name, age_or_grade_label, status_tag
    FROM class_forecast_entries
    ORDER BY forecast_month, class_band, child_display_name
  `) as unknown as ForecastRow[];

  const months = Array.from(new Set(rows.map((r) => r.forecast_month)));

  return (
    <section>
      <h1 className="font-display text-2xl font-semibold text-ink">Class Forecast</h1>
      <p className="mt-1 max-w-2xl text-[15px] text-ink-soft">
        Monthly roster forecast imported from the &quot;Student Count&quot; sheet — named students per class band per
        month, including forward-looking placeholders not yet enrolled as real Family records.
      </p>

      {months.length === 0 && (
        <p className="mt-6 text-ink-soft">
          No forecast imported yet — run <code>npm run db:import-family</code> with the enrollment spreadsheet.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-10">
        {months.map((month) => {
          const monthRows = rows.filter((r) => r.forecast_month === month);
          return (
            <div key={month}>
              <h2 className="font-display text-xl font-semibold text-ink">{month}</h2>
              <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {CLASS_BAND_ORDER.map((band) => {
                  const bandRows = monthRows.filter((r) => r.class_band === band);
                  return (
                    <div key={band} className="rounded-md border border-sand-line bg-paper p-4 shadow-soft">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-base font-semibold text-teal-deep">{CLASS_BAND_LABELS[band]}</span>
                        <span className="text-xs font-bold text-ink-soft">{bandRows.length}</span>
                      </div>
                      <ul className="mt-2 flex flex-col gap-1 text-sm text-ink-soft">
                        {bandRows.map((r, i) => (
                          <li key={i} className="flex items-center justify-between gap-2">
                            <span className="text-ink">{r.child_display_name}</span>
                            <span className="whitespace-nowrap text-xs">
                              {r.age_or_grade_label}
                              {r.status_tag ? ` · ${r.status_tag}` : ''}
                            </span>
                          </li>
                        ))}
                        {bandRows.length === 0 && <li className="text-xs italic">None</li>}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
