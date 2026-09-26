/** pdf-parse's ESM build routes through pdfjs-dist's Node-safe "legacy" build (see the Turbopack
 * alias in next.config.mjs), which tries to polyfill DOMMatrix/ImageData/Path2D via the optional
 * native @napi-rs/canvas package and merely *warns* if that's unavailable -- but confirmed via
 * Vercel's own runtime logs, something elsewhere in that same module still references the bare
 * `DOMMatrix` identifier unconditionally at module evaluation time, which throws the instant the
 * polyfill attempt has already failed, before any of pdf-parse's own code runs. @napi-rs/canvas is
 * a native binary addon that Vercel's serverless function bundling drops entirely (the same logs:
 * "Cannot find module '@napi-rs/canvas'"), so this fails in production regardless of which
 * pdf-parse/pdfjs-dist build variant loads.
 *
 * We only ever call pdf-parse's getText() -- never anything that touches real rendering/canvas
 * output -- so an inert stand-in is enough to satisfy the reference and let the module load; a
 * real canvas implementation is never needed. Imported for its side effect only, and before
 * pdf-parse itself (see pdf-extract.ts), so these globals already exist by the time pdf-parse's
 * own module graph evaluates -- static imports run in source order, depth-first. */
for (const name of ['DOMMatrix', 'ImageData', 'Path2D'] as const) {
  if (typeof (globalThis as Record<string, unknown>)[name] === 'undefined') {
    (globalThis as Record<string, unknown>)[name] = class {};
  }
}
