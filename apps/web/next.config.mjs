/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["gsap", "lenis"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
