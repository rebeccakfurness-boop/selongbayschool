/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse's default ("require") build bundles a browser/canvas-capable pdf.js variant that
  // references the DOM-only `DOMMatrix` global at module top level -- fine in a browser, but a
  // ReferenceError the instant Node evaluates the module, before any of our code runs. Keeping it
  // out of the webpack bundle and reaching it via dynamic import() (see pdf-extract.ts) makes Node
  // resolve its clean, canvas-free ESM build instead.
  serverExternalPackages: ['pdf-parse'],
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
