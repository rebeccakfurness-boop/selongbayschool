/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ],
  },
};

export default nextConfig;
