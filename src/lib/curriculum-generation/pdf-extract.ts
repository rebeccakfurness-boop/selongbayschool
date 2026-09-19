/** Extracts plain text from a PDF buffer -- the source text handed to
 * ContentGenerationProvider.parseSyllabus/analyzeWorkbook. Both the Course Builder's syllabus
 * upload (required) and workbook upload (optional) go through this before any LLM call, so a
 * malformed or scanned-image-only PDF fails loudly here rather than producing an empty prompt.
 *
 * pdf-parse is imported dynamically (not at module top level) and kept out of the webpack bundle
 * (see serverExternalPackages in next.config.mjs) so Node resolves it via its own "import"
 * condition -- pdf-parse's default build references the browser-only `DOMMatrix` global at module
 * evaluation time, which crashes instantly in a Node.js serverless function; its ESM build has no
 * such reference. */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
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
