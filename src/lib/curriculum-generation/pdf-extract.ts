// Side-effect only, and before pdf-parse itself -- see that file's own comment for why. Must stay
// first: static imports evaluate in source order, and pdf-parse's module graph needs these globals
// to already exist by the time it evaluates, not after.
import './dommatrix-polyfill';
import { PDFParse } from 'pdf-parse';

/** Extracts plain text from a PDF buffer -- the source text handed to
 * ContentGenerationProvider.parseSyllabus/analyzeWorkbook. Both the Course Builder's syllabus
 * upload (required) and workbook upload (optional) go through this before any LLM call, so a
 * malformed or scanned-image-only PDF fails loudly here rather than producing an empty prompt.
 *
 * next.config.mjs also aliases "pdf-parse" to its known-clean-of-DOMMatrix-references ESM entry
 * file (see that alias's own comment for the naive fixes that didn't work before this one) -- that
 * alias plus this polyfill together are both needed: the alias picks pdfjs-dist's Node-safe
 * "legacy" build, and the polyfill is what stops *that* build's own failed attempt to polyfill
 * DOMMatrix via the (missing-in-production) @napi-rs/canvas package from crashing the module. */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result.text.trim();
    if (!text) {
      throw new Error('No extractable text found in this PDF (it may be a scanned image without a text layer).');
    }
    return text;
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
