import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin";
import { adminGetMetrics, adminListUsers } from "@/app/actions/admin";
import { Card } from "@/app/components/ui/Card";

/**
 * Админка v1 (Урок 5, Шаг 2) — список пользователей + мини-сводка. Read-only.
 * Серверный гейт: не-админ → 404 (скрываем существование). Данные — server-actions
 * (каждое через requireAdmin). Поиск — GET-параметр ?q.
 */
export const dynamic = "force-dynamic"; // живые данные сессии+БД, без статического кэша

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { year: "numeric", month: "short", day: "numeric" });
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) notFound();

  const { q } = await searchParams;
  const [metrics, users] = await Promise.all([adminGetMetrics(), adminListUsers(q)]);

  const stats: [string, number][] = [
    ["Пользователей", metrics.users],
    ["Досок", metrics.boards],
    ["Новых за 7 дней", metrics.newUsers7d],
  ];

  return (
    <main className="min-h-screen bg-surface-muted px-4 py-12">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-[28px] leading-snug text-t1">Пользователи</h1>
          <Link href="/" className="font-mono text-[11.5px] text-t2 hover:text-t1 transition-colors duration-200">
            На главную
          </Link>
        </div>

        {/* Мини-сводка */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map(([label, value]) => (
            <Card key={label} className="px-4 py-3">
              <div className="font-serif text-[24px] leading-none text-t1">{value}</div>
              <div className="mt-1 font-mono text-[10.5px] uppercase tracking-wide text-t3">{label}</div>
            </Card>
          ))}
        </div>

        {/* Поиск */}
        <form method="get" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Поиск по имени или email…"
            className="flex-1 rounded-sm border border-border bg-surface px-3 py-2 text-[13px] text-t1 placeholder:text-t3 focus:outline-none focus:border-border-strong"
          />
          <button
            type="submit"
            className="rounded-sm border border-border bg-surface px-4 py-2 font-mono text-[11.5px] text-t2 hover:text-t1 hover:border-border-strong transition-colors cursor-pointer"
          >
            Искать
          </button>
        </form>

        {/* Таблица */}
        <Card className="overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[10.5px] uppercase tracking-wide text-t3">
                <th className="px-4 py-2.5 font-normal">Имя</th>
                <th className="px-4 py-2.5 font-normal">Email</th>
                <th className="px-4 py-2.5 font-normal">Регистрация</th>
                <th className="px-4 py-2.5 font-normal text-right">Проекты</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-muted transition-colors">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/users/${u.id}`} className="text-t1 hover:underline">
                      {u.name || "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-t2 truncate max-w-[220px]">{u.email}</td>
                  <td className="px-4 py-2.5 text-t2 font-mono text-[11.5px]">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right text-t2 font-mono">{u.boardCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="px-4 py-6 text-center text-[13px] text-t3">
              {q ? "Ничего не найдено" : "Пользователей нет"}
            </p>
          )}
        </Card>
      </div>
    </main>
  );
}
