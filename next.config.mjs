/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  experimental: {
    // Perkecil bundle JS: hanya ikon lucide-react yang dipakai yang dibundel.
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
