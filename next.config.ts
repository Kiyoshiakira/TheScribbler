import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
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
  serverActions: {
    bodySizeLimit: '4.5mb',
    maxDuration: 300, // 5 minutes
  },
  async headers() {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.google.com https://www.gstatic.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com;
      img-src 'self' blob: data: https://images.unsplash.com https://picsum.photos https://lh3.googleusercontent.com;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://*.google.com https://*.googleapis.com https://*.googleusercontent.com wss://*.cloudworkstations.dev https://www.googleapis.com;
      frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://apis.google.com https://www.google.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
    `;
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
