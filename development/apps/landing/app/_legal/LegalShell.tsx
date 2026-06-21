import Link from "next/link";
import type { ReactNode } from "react";

// Общий каркас юр-страниц (/privacy, /terms, /cookies). Презентационный, серверный.
// Стили — через бренд-токены лендинга (Tailwind v4 @theme: navy/cream/gold/font-display).
// Дочерние h2/p/ul оформляются селекторами ниже — страницы пишут чистый контент.
export default function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-cream text-navy">
      <div className="mx-auto max-w-[720px] px-6 py-16 sm:py-24">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-widest text-soft transition-colors hover:text-gold"
        >
          ← AXON
        </Link>

        <h1 className="mt-8 font-display text-4xl leading-tight text-navy sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-widest text-soft">
          Обновлено: {updated}
        </p>

        <div
          className="
            mt-12
            [&_h2]:mt-12 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-navy
            [&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:font-display [&_h3]:text-xl [&_h3]:text-navy
            [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-navy/80
            [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_ul]:text-navy/80
            [&_li]:leading-relaxed
            [&_a]:text-gold [&_a]:underline [&_a]:underline-offset-2
            [&_strong]:font-semibold [&_strong]:text-navy
          "
        >
          {children}
        </div>

        <div className="mt-16 border-t border-navy/10 pt-6">
          <p className="font-mono text-xs leading-relaxed text-soft">
            Это типовой документ под 152-ФЗ. При масштабировании проекта или появлении
            платежей его стоит проверить у юриста.
          </p>
          <nav className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-widest">
            <Link href="/privacy" className="text-soft transition-colors hover:text-gold">
              Конфиденциальность
            </Link>
            <Link href="/terms" className="text-soft transition-colors hover:text-gold">
              Соглашение
            </Link>
            <Link href="/cookies" className="text-soft transition-colors hover:text-gold">
              Cookie
            </Link>
          </nav>
        </div>
      </div>
    </main>
  );
}
