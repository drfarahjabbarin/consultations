"use client";

import React, { useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Card, CardContent, CardHeader, Button, Input, Label } from "../../../components/ui";
import { strings, type Lang } from "../../../lib/i18n";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [lang, setLang] = useState<Lang>("ar");
  const t = useMemo(() => strings[lang], [lang]);
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [email, setEmail] = useState("dr.f.jabb@gmail.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();

  async function signIn() {
    setErr(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/admin");
    } catch (e: any) {
      setErr(lang === "ar" ? "بيانات الدخول غير صحيحة" : "Invalid credentials");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md p-4 md:p-8" dir={dir}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t.login}</h1>
          <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={lang === "ar" ? "primary" : "secondary"} onClick={() => setLang("ar")} type="button">
            عربي
          </Button>
          <Button variant={lang === "en" ? "primary" : "secondary"} onClick={() => setLang("en")} type="button">
            EN
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">{t.login}</div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t.adminEmail}</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
          </div>
          <div>
            <Label>{t.adminPassword}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {err && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {err}
            </div>
          )}

          <Button onClick={signIn} disabled={busy} className="w-full" type="button">
            {busy ? (lang === "ar" ? "جارٍ الدخول..." : "Signing in...") : t.signIn}
          </Button>

          <div className="text-center text-xs text-slate-500">
            <a className="underline" href="/">
              {lang === "ar" ? "العودة للصفحة الرئيسية" : "Back to home"}
            </a>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
