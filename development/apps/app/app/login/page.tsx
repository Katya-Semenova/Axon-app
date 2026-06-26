"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { BASE_PATH } from "@/lib/base-path";
import { Card, CardHeader, CardContent, CardFooter } from "@/app/components/ui/Card";
import { FormField } from "@/app/components/ui/FormField";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";

/* TODO (полировка): тексты захардкожены по-русски — вынести в i18n (messages/*),
   и довести визуал по DESIGN.md. Сейчас — функциональный экран v1. */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  /* Демо-кнопка для показа — рендерим только когда демо включено на этом окружении. */
  const demoEnabled = process.env.NEXT_PUBLIC_DEMO_ENABLED === "true";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || demoLoading) return; // защита от двойного submit
    setError(null);
    setLoading(true);
    const res = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? "Неверный email или пароль");
      return;
    }
    router.push("/");
    router.refresh();
  }

  /* Вход в общий демо-аккаунт: сервер ставит куку (пароль в браузер не попадает). */
  async function handleDemo() {
    if (loading || demoLoading) return; // защита от двойного клика
    setError(null);
    setDemoLoading(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/demo/login`, { method: "POST" });
      if (!res.ok) {
        setError(res.status === 404 ? "Демо сейчас недоступно." : "Не удалось войти в демо. Попробуйте ещё раз.");
        setDemoLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Сеть недоступна. Проверьте соединение и попробуйте ещё раз.");
      setDemoLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-muted px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="font-sans text-[18px] font-semibold text-t1">Вход в Axon</h1>
          <p className="mt-1 text-[12.5px] text-t3">Войдите, чтобы продолжить работу с проектами.</p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-3">
            <FormField label="Email" htmlFor="email">
              <Input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </FormField>
            <FormField label="Пароль" htmlFor="password">
              <Input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </FormField>
            {error && <p className="text-[11.5px] text-error">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" loading={loading} disabled={demoLoading} className="w-full">Войти</Button>
            {demoEnabled && (
              <>
                <div className="flex items-center gap-2 text-[11px] text-t3">
                  <span className="h-px flex-1 bg-border" />или<span className="h-px flex-1 bg-border" />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  loading={demoLoading}
                  disabled={loading}
                  onClick={handleDemo}
                  className="w-full"
                >
                  Попробовать демо
                </Button>
                <p className="text-[11px] text-t3 text-center">
                  Демо-режим: вход без регистрации, несколько запросов к ИИ.
                </p>
              </>
            )}
            <p className="text-[12px] text-t3 text-center">
              <Link href="/forgot-password" className="text-t1 underline underline-offset-4">Забыли пароль?</Link>
            </p>
            <p className="text-[12px] text-t3 text-center">
              Нет аккаунта?{" "}
              <Link href="/register" className="text-t1 underline underline-offset-4">Зарегистрироваться</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
