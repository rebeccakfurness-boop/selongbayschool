import * as pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';

/** Two separate Vercel-serverless-bundling workarounds pdf-parse needs before it's safe to import
 * (see pdf-extract.ts) -- both diagnosed from Vercel's own runtime logs across several rounds of
 * this fix, not guessed. Kept in one file, imported first for its side effects only, since both
 * have to be in place before pdf-parse's own module graph evaluates.
 *
 * 1. DOMMatrix/ImageData/Path2D: pdf-parse's ESM build routes through pdfjs-dist's Node-safe
 *    "legacy" build (see the Turbopack alias in next.config.mjs), which tries to polyfill these
 *    via the optional native @napi-rs/canvas package and merely *warns* if that's unavailable --
 *    but something elsewhere in that same module still references the bare `DOMMatrix` identifier
 *    unconditionally, throwing the instant the polyfill attempt has already failed.
 *    @napi-rs/canvas is a native binary addon that Vercel's serverless function bundling drops
 *    entirely ("Cannot find module '@napi-rs/canvas'"), so this fails regardless of build variant.
 *    We only ever call getText() -- never real rendering -- so an inert stand-in is enough.
 *
 * 2. The pdf.js worker: by default, pdf.js resolves its own worker script (which does the actual
 *    parsing) via a *dynamically computed* path relative to wherever its own bundled chunk ends up
 *    -- fine when every file keeps its on-disk layout, but Turbopack merges everything into a
 *    handful of chunk files, so that computed path doesn't exist in the deployed function
 *    ("Cannot find module '/var/task/.next/server/chunks/pdf.worker.mjs'"). Statically importing
 *    the worker module ourselves forces Turbopack to trace and bundle it as a normal dependency
 *    (rather than leave it to that runtime-computed path), and pdf.js's own fake-worker setup
 *    checks `globalThis.pdfjsWorker.WorkerMessageHandler` first and skips the dynamic import
 *    entirely when it's already there (see PDFWorker.#mainThreadWorkerMessageHandler in
 *    pdfjs-dist/legacy/build/pdf.mjs) -- this is the same convenience hook pdf-parse's own
 *    PDFParse.setWorker() uses for `globalThis.pdfjs`, just the worker's counterpart. */
for (const name of ['DOMMatrix', 'ImageData', 'Path2D'] as const) {
  if (typeof (globalThis as Record<string, unknown>)[name] === 'undefined') {
    (globalThis as Record<string, unknown>)[name] = class {};
  }
}

(globalThis as Record<string, unknown>).pdfjsWorker = pdfjsWorker;
