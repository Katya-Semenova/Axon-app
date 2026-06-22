"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { BASE_PATH } from "@/lib/base-path";
import { Card, CardHeader, CardContent, CardFooter } from "@/app/components/ui/Card";
import { FormField } from "@/app/components/ui/FormField";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";

/* TODO (полировка): тексты захардкожены по-русски — вынести в i18n (messages/*),
   как у login/register. Сейчас — функциональный экран v1 (Шаг 6). */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    /* Ссылка из письма ведёт на /reset-password?token=… (токен добавит Better Auth).
       redirectTo — С приставкой /ai-studio: иначе финальный редирект уйдёт на лендинг → 404. */
    await authClient
      .requestPasswordReset({ email, redirectTo: `${BASE_PATH}/reset-password` })
      .catch((err) => console.error("[forgot-password]", err));
    setLoading(false);
    /* Нейтральное сообщение в любом случае — не раскрываем, есть ли такой аккаунт. */
    setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-muted px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="font-sans text-[18px] font-semibold text-t1">Сброс пароля</h1>
          <p className="mt-1 text-[12.5px] text-t3">Укажите email — пришлём ссылку для сброса пароля.</p>
        </CardHeader>

        {sent ? (
          <CardContent className="flex flex-col gap-4">
            <p className="text-[13px] text-t2 leading-relaxed">
              Если для этого адреса есть аккаунт, мы отправили на него письмо со ссылкой для сброса пароля.
              Проверьте почту (и папку «Спам»).
            </p>
            <Link href="/login" className="text-[12px] text-t1 underline underline-offset-4 text-center">
              Вернуться ко входу
            </Link>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="flex flex-col gap-3">
              <FormField label="Email" htmlFor="email">
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              </FormField>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" loading={loading} className="w-full">Отправить ссылку</Button>
              <p className="text-[12px] text-t3 text-center">
                <Link href="/login" className="text-t1 underline underline-offset-4">Вернуться ко входу</Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </main>
  );
}
