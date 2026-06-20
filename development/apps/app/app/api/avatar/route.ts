import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { putObject } from "@/lib/storage";

/**
 * Загрузка аватара (Урок 4, Шаг 8).
 * Только для вошедшего и только свой аватар (id из серверной сессии).
 * Проверка файла — по СОДЕРЖИМОМУ (magic bytes), не по расширению, + лимит размера.
 * Возвращает публичную ссылку; запись в User.image делает клиент через
 * authClient.updateUser (чтобы обновилась и сессия Better Auth).
 */
const MAX_BYTES = 2 * 1024 * 1024; // 2 МБ

function detectImage(buf: Buffer): { ext: string; type: string } | null {
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return { ext: "png", type: "image/png" };
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return { ext: "jpg", type: "image/jpeg" };
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP")
    return { ext: "webp", type: "image/webp" };
  return null;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no-file" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too-large" }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  const kind = detectImage(buf);
  if (!kind) return NextResponse.json({ error: "bad-type" }, { status: 415 });

  try {
    const key = `avatars/${session.user.id}-${Date.now()}.${kind.ext}`;
    await putObject(key, buf, kind.type);
    // Показываем через наш домен, а не публичный URL провайдера.
    return NextResponse.json({ url: `/api/files/${key}` });
  } catch (err) {
    console.error("[avatar] upload failed:", err);
    return NextResponse.json({ error: "upload-failed" }, { status: 500 });
  }
}
