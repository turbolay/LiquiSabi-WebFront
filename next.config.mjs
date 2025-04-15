/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api',
        destination: 'http://127.0.0.1:48238',
      },
    ];
  },
};

export default nextConfig;

