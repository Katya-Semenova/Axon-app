"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/app/components/ui/Button";
import { AuthModal } from "@/app/components/AuthModal";

/**
 * Кнопка «Войти» в тулбаре холста — снимает тупик «чтобы войти, надо уйти на лендинг».
 * Показывается только разлогиненному. По клику открывает AuthModal на вкладке «Вход»
 * (purpose="login" — тексты про возврат к проектам, НЕ про сохранение).
 * После успешного входа вызывает onLoggedIn() — родитель уводит к «Мои проекты»
 * (вариант А: «Войти» = к своим проектам; «Сохранить» = оставить текущий холст).
 */
export function GuestLoginButton({ onLoggedIn }: { onLoggedIn: () => void }) {
  const { data: session } = authClient.useSession();
  const t = useTranslations("SaveFlow");
  const [open, setOpen] = useState(false);

  /* Уже вошёл — кнопка не нужна. */
  if (session) return null;

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setOpen(true)}
        className="hidden lg:inline-flex h-[28px] px-3"
        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.04em", borderRadius: 0 }}
      >
        {t("loginButton")}
      </Button>
      <AuthModal
        open={open}
        purpose="login"
        onClose={() => setOpen(false)}
        onAuthed={() => { setOpen(false); onLoggedIn(); }}
      />
    </>
  );
}
