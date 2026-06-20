import { NextRequest, NextResponse } from "next/server";
import { getObject } from "@/lib/storage";

/**
 * Отдача файлов из хранилища через наше приложение (Урок 4, Шаг 8).
 * Сервер достаёт объект из S3 подписанным запросом и отдаёт браузеру —
 * не зависим от публичных доменов провайдера, бакет может быть приватным.
 *
 * Пока открыт только префикс `avatars/` (аватары не секретны). Для СЕКРЕТНЫХ
 * файлов (исходные данные) позже будет отдельный route с проверкой владельца.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;

  // Защита от path traversal: каждый сегмент — только безопасные символы,
  // без "."/".." и пустых частей. S3-ключ литеральный (../ не уводит в др. папку),
  // но проверка дешёвая и закрывает класс атак на будущие провайдеры/префиксы.
  const SEG_OK = /^[A-Za-z0-9._-]+$/;
  if (key.some((seg) => seg === "." || seg === ".." || !SEG_OK.test(seg))) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const path = key.join("/");

  if (!path.startsWith("avatars/")) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const obj = await getObject(path);
  if (!obj) return NextResponse.json({ error: "not-found" }, { status: 404 });

  // Отдаём только безопасные image-типы; всё прочее (в т.ч. svg/html) — как бинарь
  // на скачивание. + nosniff/CSP/sandbox, чтобы браузер ничего не исполнял на нашем домене.
  const SAFE = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
  const safe = SAFE.has(obj.contentType);

  return new NextResponse(Buffer.from(obj.bytes), {
    headers: {
      "Content-Type": safe ? obj.contentType : "application/octet-stream",
      "Content-Disposition": safe ? 'inline; filename="avatar"' : 'attachment; filename="file"',
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
