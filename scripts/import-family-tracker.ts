/**
 * One-time/rerunnable import of "Student_Enrollment_and_Forcast_2026 - 2027.xlsx" into the
 * operations dashboard tables. Parsing/DB-write logic lives in src/lib/family-import.ts, shared
 * with the in-app upload at /admin/import (POST /api/admin/import-family) so the two never drift
 * apart — use whichever is more convenient; this CLI script is for local/direct-DB-access use.
 *
 * Usage:
 *   npm run db:import-family -- /path/to/file.xlsx                        # writes to DATABASE_URL
 *   npm run db:import-family -- /path/to/file.xlsx --dry-run              # parses only, prints counts, no DB
 *   npm run db:import-family -- /path/to/file.xlsx --clear-enquiries      # wipes admissions_enquiries first (safe re-run)
 */
import * as path from 'path';
import * as XLSX from 'xlsx';
import { ensureSchema } from '../src/lib/db';
import { parseFamilyWorkbook, runFamilyImport } from '../src/lib/family-import';

const DRY_RUN = process.argv.includes('--dry-run');
const CLEAR_ENQUIRIES = process.argv.includes('--clear-enquiries');
const filePath = process.argv.slice(2).find((arg) => !arg.startsWith('--'));

if (!filePath) {
  console.error('Usage: tsx scripts/import-family-tracker.ts <path-to-xlsx> [--dry-run] [--clear-enquiries]');
  process.exit(1);
}

async function main() {
  const resolved = path.resolve(filePath!);
  console.log(`Reading ${resolved}${DRY_RUN ? ' (dry run — no DB writes)' : ''}`);
  const wb = XLSX.readFile(resolved, { cellDates: true });
  const data = parseFamilyWorkbook(wb);

  console.log(
    `Parsed: ${data.children.length} current students (Sheet1), ${data.enquiries.length} admissions enquiries, ${data.forecast.length} class-forecast entries.`
  );

  if (DRY_RUN) {
    console.log('\nSample child:', JSON.stringify(data.children[0], null, 2));
    console.log('\nSample enquiry:', JSON.stringify(data.enquiries[0], null, 2));
    console.log('\nSample forecast entry:', JSON.stringify(data.forecast[0], null, 2));
    return;
  }

  await ensureSchema();
  const summary = await runFamilyImport(data, { clearExistingEnquiries: CLEAR_ENQUIRIES });

  console.log(
    `\nInserted ${summary.childrenInserted} new children (skipped ${summary.childrenParsed - summary.childrenInserted} already-imported), ` +
      `${summary.enquiriesInserted} admissions enquiries (by source: ${JSON.stringify(summary.enquiriesBySource)}), ${summary.forecastInserted} forecast entries.`
  );
  if (!CLEAR_ENQUIRIES) {
    console.log('\nNote: admissions_enquiries has no duplicate check — pass --clear-enquiries if re-running this import.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
