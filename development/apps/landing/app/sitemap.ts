import type { MetadataRoute } from "next";

const BASE_URL = "https://axon-app.ru";

// Только ПУБЛИЧНЫЕ страницы. Внутренние разделы сервиса (/app, /admin, /settings)
// в карту НЕ попадают — они закрыты в robots.txt и помечены noindex.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/cookies`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
