/** @type {import('next').NextConfig} */
module.exports = {
  transpilePackages: ["@repo/ui"],
  experimental: {
    instrumentationHook: true,
  },
};
