"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Modal } from "@/app/components/ui/Modal";
import { FormField } from "@/app/components/ui/FormField";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";

/* TODO (полировка): тексты захардкожены по-русски — вынести в i18n (messages/*),
   как login/register. Сейчас — функциональное окно v1 (Шаг 7b). */
type Tab = "login" | "register";

/**
 * Инлайн-вход/регистрация в модальном окне (Урок 4, Шаг 7b).
 * Открывается на действии «Сохранить» у гостя. При успехе вызывает onAuthed()
 * — дальше вызывающий код переносит текущий холст в аккаунт.
 */
export function AuthModal({
  open, onClose, onAuthed,
}: { open: boolean; onClose: () => void; onAuthed: () => void }) {
  const [tab, setTab] = useState<Tab>("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = tab === "register"
      ? await authClient.signUp.email({ name, email, password })
      : await authClient.signIn.email({ email, password });
    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? (tab === "register"
        ? "Не удалось зарегистрироваться"
        : "Неверный email или пароль"));
      return;
    }
    onAuthed();
  }

  const tabBtn = (value: Tab, label: string) => (
    <button
      type="button"
      onClick={() => { setTab(value); setError(null); }}
      className={`flex-1 pb-2 text-[13px] border-b-2 transition-colors duration-200 cursor-pointer ${
        tab === value ? "border-t1 text-t1 font-medium" : "border-transparent text-t3 hover:text-t2"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Modal open={open} onClose={onClose} title="Сохранить проект" size="sm">
      <p className="text-[12.5px] text-t3 mb-4 -mt-1">
        Войдите или зарегистрируйтесь — и ваша текущая работа сохранится в аккаунт.
      </p>

      <div className="flex gap-4 mb-5">
        {tabBtn("register", "Регистрация")}
        {tabBtn("login", "Вход")}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {tab === "register" && (
          <FormField label="Имя" htmlFor="am-name">
            <Input id="am-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </FormField>
        )}
        <FormField label="Email" htmlFor="am-email">
          <Input id="am-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </FormField>
        <FormField label="Пароль" htmlFor="am-password">
          <Input id="am-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={tab === "register" ? "new-password" : "current-password"} required />
        </FormField>
        {error && <p className="text-[11.5px] text-error">{error}</p>}
        <Button type="submit" loading={loading} className="w-full mt-1">
          {tab === "register" ? "Зарегистрироваться и сохранить" : "Войти и сохранить"}
        </Button>
      </form>
    </Modal>
  );
}
