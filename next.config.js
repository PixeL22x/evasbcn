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
  async headers() {
    return [
      {
        // Permitir CORS para las rutas del TPV auxiliar (desde localhost u otros dominios)
        source: "/api/tpv/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key" },
        ]
      }
    ];
  },
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

