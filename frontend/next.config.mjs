/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  sassOptions: {
    includePaths: ["./src/assets/scss"],
  },
};

export default nextConfig;
