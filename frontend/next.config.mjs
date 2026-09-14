/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  sassOptions: {
    includePaths: ["./src/assets/scss"],
  },
  async headers() {
    return [
      {
        // Browsers re-check a service worker at least once a day regardless of caching
        // headers, but no-cache here means an update to sw.js is picked up on the very
        // next load instead of waiting up to a day.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
