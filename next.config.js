/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Only run ESLint on the source directories
    dirs: ["pages", "app", "components", "lib", "src"],
  },
};

module.exports = nextConfig;
