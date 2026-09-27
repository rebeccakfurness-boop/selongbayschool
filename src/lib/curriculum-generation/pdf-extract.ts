// Side-effect only, and before pdf-parse itself -- see that file's own comment for why. Must stay
// first: static imports evaluate in source order, and pdf-parse's module graph needs these shims
// to already be in place by the time it evaluates, not after.
import './pdf-parse-node-shims';
import { PDFParse, PasswordException } from 'pdf-parse';

/** Extracts plain text from a PDF buffer -- the source text handed to
 * ContentGenerationProvider.parseSyllabus/analyzeWorkbook, and to the Budget Tracker's statement
 * importer (budget-statement-extract.ts). Both the Course Builder's syllabus upload (required) and
 * workbook upload (optional) go through this before any LLM call, so a malformed or
 * scanned-image-only PDF fails loudly here rather than producing an empty prompt.
 *
 * next.config.mjs also aliases "pdf-parse" to its known-clean-of-DOMMatrix-references ESM entry
 * file (see that alias's own comment for the naive fixes that didn't work before this one) -- the
 * alias picks pdfjs-dist's Node-safe "legacy" build, and pdf-parse-node-shims.ts is what stops two
 * further Vercel-serverless-bundling problems in that build from crashing the module.
 *
 * PDF_PASSWORD (a Vercel env var, never a value stored in this codebase -- see the school's own
 * bank statement PDFs, which several Indonesian banks issue password-protected): passed on every
 * open attempt, since pdf.js simply ignores an unnecessary password on a PDF that isn't encrypted
 * at all, so this is safe to always try rather than needing to know in advance which uploads are
 * protected and which aren't. */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const password = process.env.PDF_PASSWORD || undefined;
  const parser = new PDFParse({ data: buffer, password });
  try {
    const result = await parser.getText();
    const text = result.text.trim();
    if (!text) {
      throw new Error('No extractable text found in this PDF (it may be a scanned image without a text layer).');
    }
    return text;
  } catch (err) {
    if (err instanceof PasswordException) {
      throw new Error(
        password
          ? 'This PDF is password-protected and the configured PDF_PASSWORD did not open it -- check the password is still correct.'
          : 'This PDF is password-protected -- set PDF_PASSWORD in the Vercel project settings to let the system open it automatically.'
      );
    }
    throw err;
  } finally {
    await parser.destroy();
  }
}

/** Fetches a Vercel Blob URL's bytes and extracts its text in one step -- the Course Builder only
 * ever has the blob URL a client-side upload produced, never the raw file, by the time generation
 * runs server-side. */
export async function extractPdfTextFromUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Could not fetch PDF (${res.status}) from ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  return extractPdfText(buffer);
}
