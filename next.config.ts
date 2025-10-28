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
    ],
  },
  experimental: {
    turbo: {
      dangerouslyAllowModules: ['regenerator-runtime'],
    },
  },
  webpack: (config, { isServer }) => {
    // This is required for react-speech-recognition to work.
    // See: https://github.com/JamesBrill/react-speech-recognition/issues/287
    if (!isServer) {
        const originalEntry = config.entry as () => Promise<Record<string, string[]>>;
        config.entry = async () => {
            const entries = await originalEntry();
            if (entries['main-app'] && !entries['main-app'].includes('regenerator-runtime/runtime.js')) {
                entries['main-app'].unshift('regenerator-runtime/runtime.js');
            }
            return entries;
        };
    }
    return config;
  },
};

export default nextConfig;
