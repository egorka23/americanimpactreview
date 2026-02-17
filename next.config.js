/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), "@sparticuz/chromium-min", "puppeteer-core"];
    }
    return config;
  },
};

module.exports = nextConfig;
