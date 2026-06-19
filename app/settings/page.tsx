import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SettingsForm } from "./SettingsForm";
import { isAdminEmail } from "@/lib/admin";

/**
 * Личный кабинет (Урок 4, Шаг 7). Серверный гейт: не вошёл → на /login.
 * Сами действия (имя/пароль/удаление/выход) — на клиенте через authClient.
 */
export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return (
    <SettingsForm
      initialName={session.user.name ?? ""}
      email={session.user.email}
      initialImage={session.user.image ?? null}
      isAdmin={isAdminEmail(session.user.email)}
    />
  );
}
