/** @type {import('next').NextConfig} */
// Force restart timestamp: 2025-12-12
const nextConfig = {
  // Turbopack configuration (empty to silence warning)
  turbopack: {},
  // Optimizaciones para producción
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  // Configuración para build
  output: 'standalone',
  // Optimización de bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig

