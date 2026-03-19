import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: "saarthi",
  project: "saarthi-frontend",
  widenClientFileUpload: true,
  
  
});
