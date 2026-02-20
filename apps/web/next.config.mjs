/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["better-sqlite3"],
  transpilePackages: [
    "@coach/core-types",
    "@coach/case-library",
    "@coach/scoring-engine"
  ]
};

export default nextConfig;
