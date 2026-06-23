"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { trackEvent, GOALS } from "@/lib/analytics";
import { Card, CardHeader, CardContent, CardFooter } from "@/app/components/ui/Card";
import { FormField } from "@/app/components/ui/FormField";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";

/* TODO (полировка): тексты захардкожены по-русски — вынести в i18n (messages/*),
   и довести визуал по DESIGN.md. Сейчас — функциональный экран v1. */
export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    trackEvent(GOALS.signupStart); // начало регистрации (no-op без согласия на аналитику)
    const res = await authClient.signUp.email({ name, email, password });
    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? "Не удалось зарегистрироваться");
      return;
    }
    trackEvent(GOALS.signupComplete); // успешная регистрация
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-muted px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="font-sans text-[18px] font-semibold text-t1">Регистрация в Axon</h1>
          <p className="mt-1 text-[12.5px] text-t3">Создайте аккаунт, чтобы сохранять проекты и возвращаться к ним.</p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-3">
            <FormField label="Имя" htmlFor="name">
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </FormField>
            <FormField label="Email" htmlFor="email">
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </FormField>
            <FormField label="Пароль" htmlFor="password" hint="Минимум 8 символов">
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
            </FormField>
            {error && <p className="text-[11.5px] text-error">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <label className="flex items-start gap-2 text-[12px] text-t3 leading-snug">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 shrink-0"
                required
              />
              <span>
                Я принимаю{" "}
                {/* Юр-страницы живут на ЛЕНДИНГЕ (корень домена), а сервис под basePath
                    `/ai-studio` — поэтому обычный <a> (Next не дописывает приставку), а не
                    <Link>. target=_blank, чтобы не потерять заполненную форму регистрации. */}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-t1 underline underline-offset-4">Пользовательское соглашение</a>
                {" "}и{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-t1 underline underline-offset-4">Политику конфиденциальности</a>.
              </span>
            </label>
            <Button type="submit" loading={loading} disabled={!agreed} className="w-full">Зарегистрироваться</Button>
            <p className="text-[12px] text-t3 text-center">
              Уже есть аккаунт?{" "}
              <Link href="/login" className="text-t1 underline underline-offset-4">Войти</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
