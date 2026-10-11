import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The app shows no remote images, so the image optimiser (and its sharp dependency) stays off.
  images: { unoptimized: true },
  // Hide the floating Next.js dev-tools button (development only; never shown in production).
  devIndicators: false,
};

export default nextConfig;
