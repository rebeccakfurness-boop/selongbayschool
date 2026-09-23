/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse's default ("require") build bundles a browser/canvas-capable pdf.js variant that
  // references the DOM-only `DOMMatrix` global at module top level -- fine in a browser, but a
  // ReferenceError the instant Node evaluates the module, before any of our code runs.
  //
  // The first attempt at this fix used serverExternalPackages + a dynamic import(), on the theory
  // that Node's own ESM resolver would pick the package's clean "import" condition over the
  // cursed "require" one. That didn't hold: Next's serverExternalPackages implementation loads
  // externals through its own require()-based loader regardless of whether the call site used a
  // dynamic import, so it kept landing on the same cjs bundle (confirmed in production: "Failed
  // to load external module pdf-parse-...: ReferenceError: DOMMatrix is not defined").
  //
  // This aliases the bare "pdf-parse" specifier straight to its known-clean ESM entry file
  // (verified to have zero references to DOMMatrix or @napi-rs/canvas anywhere reachable from a
  // plain getText() call). An alias substitutes a literal filesystem path before the bundler's
  // package "exports"-conditions resolution ever runs, so it isn't affected by which condition
  // Next/Node would otherwise have picked.
  //
  // Turbopack, not webpack: `next build` on Next.js 16 uses Turbopack by default (confirmed via
  // a real build in this repo -- a webpack()-only config here hard-errors the build with "using
  // Turbopack, with a webpack config and no turbopack config"), so the alias has to go through
  // Turbopack's own config surface, not webpack's `resolve.alias`.
  turbopack: {
    resolveAlias: {
      'pdf-parse': './node_modules/pdf-parse/dist/pdf-parse/esm/index.js',
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // Optimized derivatives are cached at this TTL before Next/Vercel will re-run the resize on
    // a request. The 60s default means low-traffic pages keep re-optimizing the same images;
    // these photos don't change often, so cache them for a day instead.
    minimumCacheTTL: 60 * 60 * 24,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      // Book cover images pulled in by the ISBN/title lookup on the library catalogue (see
      // /api/admin/library/lookup-book) — stored as-is on the item rather than re-uploaded to
      // Blob storage, so Next/Image needs these hosts allowed too.
      {
        protocol: 'https',
        hostname: 'books.google.com',
      },
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
      },
    ],
  },
};

export default nextConfig;
