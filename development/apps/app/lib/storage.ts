import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

/**
 * Объектное хранилище (Урок 4, Шаг 8) — S3-совместимое (Selectel Object Storage).
 * Настройки берутся из env (S3_*). Сам файл лежит в хранилище, в БД — только ссылка.
 *
 * Отдача файлов — ЧЕРЕЗ НАШЕ приложение (route /api/files/<key>): браузер берёт файл
 * с нашего домена, а сервер достаёт его из хранилища подписанным запросом. Так не
 * зависим от публичных доменов провайдера и можем держать бакет приватным.
 * Решение по выбору хранилища — docs/decisions/ADR-006-file-storage.md
 */
const endpoint        = process.env.S3_ENDPOINT;
const region          = process.env.S3_REGION ?? "ru-1";
const accessKeyId     = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const bucket          = process.env.S3_BUCKET;

let _client: S3Client | null = null;
function client(): S3Client | null {
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null;
  if (!_client) {
    _client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: false, // vHosted-адресация Selectel
    });
  }
  return _client;
}

export function storageConfigured(): boolean {
  return !!client();
}

/** Залить объект в хранилище. Ссылку для показа строит вызывающий код (/api/files/<key>). */
export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  const c = client();
  if (!c || !bucket) throw new Error("Хранилище не настроено (нет S3_* в env)");
  await c.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
}

/** Достать объект из хранилища (для отдачи через наш route). null — если нет. */
export async function getObject(key: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const c = client();
  if (!c || !bucket) return null;
  try {
    const res = await c.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!res.Body) return null;
    const bytes = await res.Body.transformToByteArray();
    return { bytes, contentType: res.ContentType ?? "application/octet-stream" };
  } catch {
    return null;
  }
}
