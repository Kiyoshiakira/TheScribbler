import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_AI_ENABLED: (process.env.GEMINI_API_KEY || '').trim() !== '' ? 'true' : 'false',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Security: Additional headers for production
  // Note: CSP headers are intentionally NOT set here to avoid blocking Firebase Auth.
  // Firebase's modular SDK (v9+) is CSP-compliant and doesn't require 'unsafe-eval'.
  // However, some browser extensions may inject scripts that conflict with strict CSP.
  // If you need to add CSP, ensure these domains are allowed:
  // - *.firebaseapp.com (Firebase Auth)
  // - *.googleapis.com (Google APIs)
  // - accounts.google.com (Google Sign-In)
  // See docs/EXTENSION_COMPATIBILITY.md for troubleshooting extension conflicts.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
