import "server-only";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Объектное хранилище (Урок 4, Шаг 8) — S3-совместимое (Selectel Object Storage).
 * Настройки берутся из env (S3_*). Сам файл лежит в хранилище, в БД — только ссылка.
 * Без настроек клиент не создаётся — загрузка вернёт понятную ошибку (локально ок).
 * Решение по выбору хранилища — docs/decisions/ADR-006-file-storage.md
 */
const endpoint        = process.env.S3_ENDPOINT;
const region          = process.env.S3_REGION ?? "ru-1";
const accessKeyId     = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const bucket          = process.env.S3_BUCKET;
const publicBase      = process.env.S3_PUBLIC_URL; // публичный базовый URL бакета

let _client: S3Client | null = null;
function client(): S3Client | null {
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null;
  if (!_client) {
    _client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true, // совместимость с S3-провайдерами по кастомному endpoint
    });
  }
  return _client;
}

export function storageConfigured(): boolean {
  return !!client() && !!publicBase;
}

/** Залить объект и вернуть публичную ссылку на него. */
export async function putObject(key: string, body: Buffer, contentType: string): Promise<string> {
  const c = client();
  if (!c || !bucket || !publicBase) {
    throw new Error("Хранилище не настроено (нет S3_* в env)");
  }
  await c.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: "public-read",
  }));
  return `${publicBase.replace(/\/+$/, "")}/${key}`;
}
