"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
            <Button type="submit" loading={loading} className="w-full">Войти</Button>
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
