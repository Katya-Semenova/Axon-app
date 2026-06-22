"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { BASE_PATH } from "@/lib/base-path";
import { Card, CardHeader, CardContent, CardFooter } from "@/app/components/ui/Card";
import { FormField } from "@/app/components/ui/FormField";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { Avatar } from "@/app/components/ui/Avatar";

type Msg = { kind: "ok" | "err"; text: string } | null;
const MIN_LEN = 8;
const MAX_AVATAR = 2 * 1024 * 1024;

/**
 * Личный кабинет (Урок 4, Шаг 7): Профиль (имя), Безопасность (смена пароля),
 * Выход и «Опасная зона» (удаление аккаунта с подтверждением паролем).
 * Двуязычный (RU/EN). Сообщения — инлайн под каждым блоком.
 */
export function SettingsForm({ initialName, email, initialImage, isAdmin = false }: { initialName: string; email: string; initialImage: string | null; isAdmin?: boolean }) {
  const t = useTranslations("Settings");
  const router = useRouter();

  /* ── Аватар ── */
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(initialImage);
  const [avatarMsg, setAvatarMsg] = useState<Msg>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const initials = (initialName || email || "?").slice(0, 2).toUpperCase();

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // позволить повторно выбрать тот же файл
    if (!file) return;
    setAvatarMsg(null);
    if (file.size > MAX_AVATAR) { setAvatarMsg({ kind: "err", text: t("avatarTooLarge") }); return; }
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) { setAvatarMsg({ kind: "err", text: t("avatarBadType") }); return; }
    setAvatarLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${BASE_PATH}/api/avatar`, { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload failed");
      const { url } = await res.json();
      await authClient.updateUser({ image: url });
      setImage(url);
      setAvatarMsg({ kind: "ok", text: t("avatarSaved") });
      router.refresh();
    } catch {
      setAvatarMsg({ kind: "err", text: t("avatarError") });
    } finally {
      setAvatarLoading(false);
    }
  }

  /* ── Профиль ── */
  const [name, setName] = useState(initialName);
  const [nameMsg, setNameMsg] = useState<Msg>(null);
  const [nameLoading, setNameLoading] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg(null);
    if (!name.trim()) { setNameMsg({ kind: "err", text: t("nameRequired") }); return; }
    setNameLoading(true);
    const res = await authClient.updateUser({ name: name.trim() });
    setNameLoading(false);
    if (res.error) { setNameMsg({ kind: "err", text: t("genericError") }); return; }
    setNameMsg({ kind: "ok", text: t("saved") });
    router.refresh();
  }

  /* ── Смена пароля ── */
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [conf, setConf] = useState("");
  const [pwMsg, setPwMsg] = useState<Msg>(null);
  const [pwLoading, setPwLoading] = useState(false);

  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (nw.length < MIN_LEN) { setPwMsg({ kind: "err", text: t("tooShort") }); return; }
    if (nw !== conf) { setPwMsg({ kind: "err", text: t("mismatch") }); return; }
    setPwLoading(true);
    const res = await authClient.changePassword({ currentPassword: cur, newPassword: nw, revokeOtherSessions: true });
    setPwLoading(false);
    if (res.error) { setPwMsg({ kind: "err", text: t("wrongCurrent") }); return; }
    setPwMsg({ kind: "ok", text: t("changed") });
    setCur(""); setNw(""); setConf("");
  }

  /* ── Выход ── */
  async function signOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  /* ── Удаление аккаунта ── */
  const [delPw, setDelPw] = useState("");
  const [delMsg, setDelMsg] = useState<Msg>(null);
  const [delLoading, setDelLoading] = useState(false);

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDelMsg(null);
    if (!window.confirm(t("deleteConfirm"))) return;
    setDelLoading(true);
    const res = await authClient.deleteUser({ password: delPw });
    setDelLoading(false);
    if (res.error) { setDelMsg({ kind: "err", text: t("wrongPassword") }); return; }
    router.push("/");
    router.refresh();
  }

  const msgLine = (m: Msg) =>
    m && <p className={`text-[11.5px] ${m.kind === "ok" ? "text-success" : "text-error"}`}>{m.text}</p>;

  return (
    <main className="min-h-screen bg-surface-muted px-4 py-12">
      <div className="w-full max-w-md mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-[28px] leading-snug text-t1">{t("title")}</h1>
          <Link href="/" className="font-mono text-[11.5px] text-t2 hover:text-t1 transition-colors duration-200">
            {t("back")}
          </Link>
        </div>

        {isAdmin && (
          <Card variant="interactive">
            <Link href="/admin/users" className="flex items-center justify-between px-5 py-3">
              <span className="font-sans text-[14px] font-semibold text-t1">Админка</span>
              <span className="font-mono text-[11.5px] text-t2">Пользователи ›</span>
            </Link>
          </Card>
        )}

        {/* Аватар */}
        <Card>
          <CardHeader><h2 className="font-sans text-[15px] font-semibold text-t1">{t("avatarTitle")}</h2></CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar initials={initials} src={image} size="lg" />
            <div className="flex flex-col gap-1.5">
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onPickAvatar} className="hidden" />
              <Button type="button" variant="outline" size="sm" loading={avatarLoading} onClick={() => fileRef.current?.click()}>
                {t("upload")}
              </Button>
              <p className="text-[11px] text-t3">{t("avatarHint")}</p>
              {msgLine(avatarMsg)}
            </div>
          </CardContent>
        </Card>

        {/* Профиль */}
        <Card>
          <CardHeader><h2 className="font-sans text-[15px] font-semibold text-t1">{t("profileTitle")}</h2></CardHeader>
          <form onSubmit={saveName}>
            <CardContent className="flex flex-col gap-3">
              <FormField label={t("name")} htmlFor="s-name">
                <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </FormField>
              <p className="text-[11.5px] text-t3">{email}</p>
              {msgLine(nameMsg)}
            </CardContent>
            <CardFooter>
              <Button type="submit" size="sm" loading={nameLoading}>{t("save")}</Button>
            </CardFooter>
          </form>
        </Card>

        {/* Безопасность */}
        <Card>
          <CardHeader><h2 className="font-sans text-[15px] font-semibold text-t1">{t("securityTitle")}</h2></CardHeader>
          <form onSubmit={changePw}>
            <CardContent className="flex flex-col gap-3">
              <FormField label={t("current")} htmlFor="s-cur">
                <Input id="s-cur" type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required />
              </FormField>
              <FormField label={t("new")} htmlFor="s-new">
                <Input id="s-new" type="password" value={nw} onChange={(e) => setNw(e.target.value)} autoComplete="new-password" required />
              </FormField>
              <FormField label={t("confirm")} htmlFor="s-conf">
                <Input id="s-conf" type="password" value={conf} onChange={(e) => setConf(e.target.value)} autoComplete="new-password" required />
              </FormField>
              {msgLine(pwMsg)}
            </CardContent>
            <CardFooter>
              <Button type="submit" size="sm" loading={pwLoading}>{t("change")}</Button>
            </CardFooter>
          </form>
        </Card>

        {/* Выход */}
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <span className="text-[13px] text-t2">{email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>{t("signOut")}</Button>
          </CardContent>
        </Card>

        {/* Опасная зона */}
        <Card className="border-error/40">
          <CardHeader><h2 className="font-sans text-[15px] font-semibold text-error">{t("dangerTitle")}</h2></CardHeader>
          <form onSubmit={deleteAccount}>
            <CardContent className="flex flex-col gap-3">
              <p className="text-[12.5px] text-t2 leading-relaxed">{t("dangerDesc")}</p>
              <FormField label={t("dangerPassword")} htmlFor="s-del">
                <Input id="s-del" type="password" value={delPw} onChange={(e) => setDelPw(e.target.value)} autoComplete="current-password" required />
              </FormField>
              {msgLine(delMsg)}
            </CardContent>
            <CardFooter>
              <Button type="submit" variant="destructive" size="sm" loading={delLoading}>{t("delete")}</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
