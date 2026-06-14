import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // next/image отдаёт современные форматы (в 2–4× легче PNG/JPG)
    formats: ["image/avif", "image/webp"],
    // Брейкпоинты Axon (см. DESIGN.md / Tailwind): мобилка не грузит десктопный файл
    deviceSizes: [375, 640, 768, 1024, 1440, 1920],
    imageSizes: [16, 32, 64, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
