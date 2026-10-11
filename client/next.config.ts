import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The app shows no remote images, so the image optimiser (and its sharp dependency) stays off.
  images: { unoptimized: true },
};

export default nextConfig;
