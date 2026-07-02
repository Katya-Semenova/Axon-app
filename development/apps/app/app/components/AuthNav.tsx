"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { BASE_PATH } from "@/lib/base-path";
import { Avatar } from "./ui/Avatar";

/** Самолечение старых аватаров: записи, сделанные ДО появления basePath (Урок 6),
 *  хранят путь без `/ai-studio` (`/api/files/...`) → 404 → битая картинка. Дописываем
 *  префикс к относительным путям сервиса. Внешние URL (https://, напр. Google-вход) и
 *  уже-префиксованные пути (`/ai-studio/...`) не трогаем. */
function normalizeAvatarSrc(src?: string | null): string | null | undefined {
  if (src && BASE_PATH && src.startsWith("/api/")) return `${BASE_PATH}${src}`;
  return src;
}

/**
 * Состояние входа в шапке (Урок 4, Шаг 5).
 * Гость — ссылка «Войти». Вошедший — аватар + «Выйти».
 */
export function AuthNav() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div className="w-7 h-7" aria-hidden />;
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="text-[13.5px] text-t2 hover:text-t1 transition-colors duration-200"
      >
        Войти
      </Link>
    );
  }

  const user = session.user;
  const initials = (user.name || user.email || "?").slice(0, 2).toUpperCase();

  async function handleLogout() {
    await authClient.signOut();
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/settings" title="Настройки" className="transition-opacity duration-200 hover:opacity-80">
        <Avatar initials={initials} src={normalizeAvatarSrc(user.image)} size="sm" />
      </Link>
      <button
        onClick={handleLogout}
        className="text-[13px] text-t2 hover:text-t1 transition-colors duration-200 cursor-pointer"
      >
        Выйти
      </button>
    </div>
  );
}
