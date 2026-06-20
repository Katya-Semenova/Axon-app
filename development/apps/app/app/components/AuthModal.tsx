"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { Modal } from "@/app/components/ui/Modal";
import { FormField } from "@/app/components/ui/FormField";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";

type Tab = "login" | "register";

/**
 * Инлайн-вход/регистрация в модальном окне (Урок 4, Шаг 7b).
 * Открывается на действии «Сохранить» у гостя. При успехе вызывает onAuthed()
 * — дальше вызывающий код переносит текущий холст в аккаунт.
 */
export function AuthModal({
  open, onClose, onAuthed,
}: { open: boolean; onClose: () => void; onAuthed: () => void }) {
  const t = useTranslations("SaveFlow");
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
      setError(res.error.message ?? (tab === "register" ? t("errRegister") : t("errLogin")));
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
    <Modal open={open} onClose={onClose} title={t("modalTitle")} size="sm">
      <p className="text-[12.5px] text-t3 mb-4 -mt-1">
        {t("modalSubtitle")}
      </p>

      <div className="flex gap-4 mb-5">
        {tabBtn("register", t("tabRegister"))}
        {tabBtn("login", t("tabLogin"))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {tab === "register" && (
          <FormField label={t("name")} htmlFor="am-name">
            <Input id="am-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </FormField>
        )}
        <FormField label={t("email")} htmlFor="am-email">
          <Input id="am-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </FormField>
        <FormField label={t("password")} htmlFor="am-password">
          <Input id="am-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={tab === "register" ? "new-password" : "current-password"} required />
        </FormField>
        {error && <p className="text-[11.5px] text-error">{error}</p>}
        <Button type="submit" loading={loading} className="w-full mt-1">
          {tab === "register" ? t("submitRegister") : t("submitLogin")}
        </Button>
      </form>
    </Modal>
  );
}
