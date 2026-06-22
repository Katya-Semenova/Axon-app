import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Автономная сборка (server.js) для упаковки в Docker (Урок 3 — переезд на VPS).
  // На Vercel безопасно: платформа использует собственную сборку.
  output: "standalone",
  // Монорепо (Урок 6): общие node_modules и @axon/ui лежат уровнем выше — в development/.
  // Без этого standalone не дотягивает их в коробку и сервис падает «модуль не найден».
  // Корень трассировки = корень workspace (../../ от apps/app/).
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // Линт отвязан от сборки: ESLint гоняем отдельно (npm run lint / ревью на Шаге 11),
  // чтобы давние замечания в коде не валили прод-сборку и деплой.
  eslint: { ignoreDuringBuilds: true },
  images: {
    // next/image отдаёт современные форматы (в 2–4× легче PNG/JPG)
    formats: ["image/avif", "image/webp"],
    // Брейкпоинты Axon (см. DESIGN.md / Tailwind): мобилка не грузит десктопный файл
    deviceSizes: [375, 640, 768, 1024, 1440, 1920],
    imageSizes: [16, 32, 64, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },
  // Защитные HTTP-заголовки на все маршруты (Урок 3, Шаг 4 — security-аудит).
  // Vercel сам ставит HSTS; остальное добавляем здесь.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Запрет встраивания в <iframe> на чужих сайтах (анти-кликджекинг)
          { key: "X-Frame-Options", value: "DENY" },
          // Браузер не «угадывает» MIME-тип в обход заявленного
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Не утекать полный URL в Referer на сторонние домены
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Отключаем доступ к камере/микрофону/геолокации (приложению не нужны)
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
