import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin";
import { adminGetUser } from "@/app/actions/admin";
import { Card, CardHeader, CardContent } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";

/**
 * Админка v1 (Урок 5, Шаг 2) — детали пользователя + его доски. Read-only.
 * Серверный гейт: не-админ → 404. Несуществующий юзер → 404.
 */
export const dynamic = "force-dynamic";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { year: "numeric", month: "short", day: "numeric" });
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) notFound();

  const { id } = await params;
  const user = await adminGetUser(id);
  if (!user) notFound();

  return (
    <main className="min-h-screen bg-surface-muted px-4 py-12">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-5">
        <Link href="/admin/users" className="font-mono text-[11.5px] text-t2 hover:text-t1 transition-colors duration-200">
          ‹ К списку пользователей
        </Link>

        {/* Профиль */}
        <Card>
          <CardHeader>
            <h1 className="font-serif text-[24px] leading-snug text-t1">{user.name || "—"}</h1>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-t3">Email</span>
              <span className="text-t1">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-t3">Email подтверждён</span>
              <Badge variant={user.emailVerified ? "success" : "outline"}>
                {user.emailVerified ? "да" : "нет"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-t3">Регистрация</span>
              <span className="text-t2 font-mono text-[11.5px]">{fmtDate(user.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-t3">Проектов</span>
              <span className="text-t2 font-mono">{user.boards.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Доски пользователя (read-only) */}
        <Card>
          <CardHeader>
            <h2 className="font-sans text-[15px] font-semibold text-t1">Проекты</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-0 px-0 py-0">
            {user.boards.length === 0 ? (
              <p className="px-5 py-5 text-center text-[13px] text-t3">У пользователя нет проектов</p>
            ) : (
              user.boards.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between px-5 py-2.5 border-b border-border last:border-0"
                >
                  <span className="text-[13px] text-t1 truncate max-w-[320px]">{b.title || "Без названия"}</span>
                  <span className="flex items-center gap-3 shrink-0">
                    {b.shared && <Badge variant="outline">публичная</Badge>}
                    <span className="text-t3 font-mono text-[11px]">{fmtDate(b.updatedAt)}</span>
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
