import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getAdminSession } from "@/lib/admin";

/**
 * Гейт витрины дизайн-системы (Урок 7, Задание 12; спека — docs/screens/storybook.md).
 * На проде — только админ (ADMIN_EMAIL), остальным 404 — тот же паттерн, что /admin:
 * существование служебной страницы не раскрываем. В dev открыта без входа.
 */
export default async function StorybookLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    const session = await getAdminSession();
    if (!session) notFound();
  }
  return <>{children}</>;
}
