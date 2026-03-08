/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/about", destination: "/about-journal", permanent: true },
      { source: "/peer-review", destination: "/for-reviewers", permanent: true },
      { source: "/authors", destination: "/for-authors", permanent: true },
      { source: "/guidelines", destination: "/for-authors", permanent: true },
      { source: "/submission-guidelines", destination: "/for-authors", permanent: true },
      { source: "/submit-manuscript", destination: "/submit", permanent: true },
      { source: "/articles", destination: "/explore", permanent: true },
      { source: "/issues", destination: "/archive", permanent: true },
      { source: "/register", destination: "/signup", permanent: true },
      { source: "/ethics", destination: "/policies", permanent: true },
    ];
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), "@sparticuz/chromium-min", "puppeteer-core"];
    }
    return config;
  },
};

module.exports = nextConfig;
