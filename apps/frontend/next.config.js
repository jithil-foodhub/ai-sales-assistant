/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
      {
        source: '/webhook/:path*',
        destination: 'http://localhost:3000/webhook/:path*',
      },
      {
        source: '/preview/:path*',
        destination: 'http://localhost:3000/preview/:path*',
      },
      {
        source: '/sites/:path*',
        destination: 'http://localhost:3000/sites/:path*',
      },
    ];
  },
};

module.exports = nextConfig;