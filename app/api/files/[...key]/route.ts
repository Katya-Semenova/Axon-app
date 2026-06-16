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
  const path = key.join("/");

  if (!path.startsWith("avatars/")) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const obj = await getObject(path);
  if (!obj) return NextResponse.json({ error: "not-found" }, { status: 404 });

  return new NextResponse(Buffer.from(obj.bytes), {
    headers: {
      "Content-Type": obj.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
