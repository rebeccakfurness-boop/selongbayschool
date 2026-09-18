import * as XLSX from 'xlsx';
import { extractPdfTextFromUrl } from '@/lib/curriculum-generation/pdf-extract';

export type StatementFileType = 'pdf' | 'csv' | 'xlsx';

/** Guesses the file type from a Vercel Blob URL's own extension — the client only ever offers
 * .pdf/.csv/.xlsx in its file picker (see StatementImportReview.tsx), so this just needs to agree
 * with that, not handle arbitrary input. */
export function statementFileTypeFromUrl(url: string): StatementFileType | null {
  const path = url.split('?')[0].toLowerCase();
  if (path.endsWith('.pdf')) return 'pdf';
  if (path.endsWith('.csv')) return 'csv';
  if (path.endsWith('.xlsx') || path.endsWith('.xls')) return 'xlsx';
  return null;
}

/** Reduces any of the three accepted file types down to plain text, so
 * parseBankStatementText (budget-statement-ai.ts) has one input shape regardless of source —
 * a PDF's own tabular layout and a spreadsheet's rows both come through as readable text either
 * way, and Claude is far more robust at interpreting varied bank/Wise column layouts from text
 * than any bespoke per-bank column-detection code would be. */
export async function extractStatementText(url: string, fileType: StatementFileType): Promise<string> {
  if (fileType === 'pdf') {
    return extractPdfTextFromUrl(url);
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Could not fetch statement file (${res.status}) from ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('This file has no readable sheet.');
  }
  const text = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheetName]).trim();
  if (!text) {
    throw new Error('No data found in this file.');
  }
  return text;
}
