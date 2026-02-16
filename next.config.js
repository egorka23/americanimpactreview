/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@sparticuz/chromium-min", "puppeteer-core"],
};

module.exports = nextConfig;
