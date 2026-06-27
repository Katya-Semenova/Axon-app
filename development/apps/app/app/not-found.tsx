"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/app/components/ui/Button";

/**
 * Брендовая 404 (бэклог «Безопасность → Кастомная страница 404»).
 * Крупная серифная «404» в журнальном стиле + кнопка на главную.
 * Только токены DESIGN.md (font-display, text-t1/t2/t3), текст — через i18n.
 * Кнопка ведёт на «/» через router.push — он сам дописывает basePath (/ai-studio).
 */
export default function NotFound() {
  const t = useTranslations("NotFound");
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="font-display text-t1 leading-none text-[120px] sm:text-[168px]">404</div>
      <h1 className="font-display text-t1 text-[26px] sm:text-[32px] mt-2 mb-3">
        {t("title")}
      </h1>
      <p className="text-t2 text-[15px] leading-relaxed max-w-[420px] mb-8">
        {t("description")}
      </p>
      <Button variant="primary" size="lg" onClick={() => router.push("/")}>
        {t("cta")}
      </Button>
    </main>
  );
}
