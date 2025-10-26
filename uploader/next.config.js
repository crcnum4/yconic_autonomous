/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['mongoose'],
  output: 'standalone',
  outputFileTracingRoot: __dirname
}

module.exports = nextConfig
