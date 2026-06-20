"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Card, CardHeader, CardContent, CardFooter } from "@/app/components/ui/Card";
import { FormField } from "@/app/components/ui/FormField";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";

/* TODO (полировка): тексты захардкожены по-русски — вынести в i18n (messages/*),
   как у login/register. Сейчас — функциональный экран v1 (Шаг 6). */
const MIN_LEN = 8;

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* Нет токена (ссылка битая/устаревшая) — сразу понятная ошибка. */
  if (!token) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="font-sans text-[18px] font-semibold text-t1">Ссылка недействительна</h1>
        </CardHeader>
        <CardContent>
          <p className="text-[13px] text-t2 leading-relaxed">
            Ссылка для сброса пароля устарела или неверна. Запросите новую.
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/forgot-password" className="text-[12px] text-t1 underline underline-offset-4 text-center w-full">
            Запросить новую ссылку
          </Link>
        </CardFooter>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_LEN) {
      setError(`Пароль должен быть не короче ${MIN_LEN} символов.`);
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают.");
      return;
    }
    setLoading(true);
    const res = await authClient.resetPassword({ newPassword: password, token: token! });
    setLoading(false);
    if (res.error) {
      setError("Не удалось сбросить пароль — возможно, ссылка устарела. Запросите новую.");
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="font-sans text-[18px] font-semibold text-t1">Новый пароль</h1>
        <p className="mt-1 text-[12.5px] text-t3">Придумайте новый пароль для входа в Axon.</p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-3">
          <FormField label="Новый пароль" htmlFor="password">
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
          </FormField>
          <FormField label="Повторите пароль" htmlFor="confirm">
            <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          </FormField>
          {error && <p className="text-[11.5px] text-error">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" loading={loading} className="w-full">Сохранить пароль</Button>
          <p className="text-[12px] text-t3 text-center">
            <Link href="/login" className="text-t1 underline underline-offset-4">Вернуться ко входу</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-muted px-4">
      <Suspense fallback={<div className="w-7 h-7" aria-hidden />}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
