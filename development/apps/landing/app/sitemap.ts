import type { MetadataRoute } from "next";

const BASE_URL = "https://axon-app.ru";

// Только ПУБЛИЧНЫЕ страницы. Внутренние разделы сервиса (/app, /admin, /settings)
// в карту НЕ попадают — они закрыты в robots.txt и помечены noindex.
// Юр-страницы (/privacy, /terms, /cookies) добавятся здесь при их создании (Задание 3.2).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
