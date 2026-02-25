"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase, ATTACHMENTS_BUCKET } from "../../lib/supabase";
import { Card, CardContent, CardHeader, Button, Pill } from "../../components/ui";
import { strings, type Lang } from "../../lib/i18n";
import { useRouter } from "next/navigation";

type ConsultationRow = {
  id: string;
  created_at: string;
  doctor_phone: string;
  urgency: "elective" | "urgent" | "very_urgent";
  status: "new" | "in_progress" | "closed";
  patients: Array<{
    id: string;
    name: string;
    location: string;
    location_other: string | null;
    case_summary: string | null;
  }>;
  attachments: Array<{
    id: string;
    file_path: string;
    file_name: string;
    mime_type: string | null;
    size_bytes: number | null;
  }>;
};

function urgencyTone(u: ConsultationRow["urgency"]) {
  if (u === "very_urgent") return "danger";
  if (u === "urgent") return "warn";
  return "neutral";
}

function statusTone(s: ConsultationRow["status"]) {
  if (s === "closed") return "ok";
  if (s === "in_progress") return "warn";
  return "neutral";
}

export default function AdminPage() {
  const [lang, setLang] = useState<Lang>("ar");
  const t = useMemo(() => strings[lang], [lang]);
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [rows, setRows] = useState<ConsultationRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();

  async function ensureAuth() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) router.replace("/admin/login");
  }

  async function load() {
    setErr(null);
    setBusy(true);
    try {
      // RLS should block non-admin users here.
      const { data, error } = await supabase
        .from("consultations")
        .select(
          "id, created_at, doctor_phone, urgency, status, patients(id,name,location,location_other,case_summary), attachments(id,file_path,file_name,mime_type,size_bytes)"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows((data || []) as any);
    } catch (e: any) {
      setErr(lang === "ar" ? "لا يمكن عرض البيانات. تأكد من صلاحيات المشرف (RLS)." : "Cannot load data. Check admin/RLS policies.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  async function updateStatus(id: string, status: ConsultationRow["status"]) {
    try {
      const { error } = await supabase.from("consultations").update({ status }).eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (e) {
      // ignore
    }
  }

  async function getPublicUrl(path: string) {
    const { data } = supabase.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  useEffect(() => {
    ensureAuth().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto w-full max-w-4xl p-4 md:p-8" dir={dir}>
      <header className="mb-4 md:mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{t.consultations}</h1>
            <p className="mt-1 text-sm text-slate-600">{t.newestFirst}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={lang === "ar" ? "primary" : "secondary"} onClick={() => setLang("ar")} type="button">
              عربي
            </Button>
            <Button variant={lang === "en" ? "primary" : "secondary"} onClick={() => setLang("en")} type="button">
              EN
            </Button>
            <Button variant="secondary" onClick={load} type="button">
              {lang === "ar" ? "تحديث" : "Refresh"}
            </Button>
            <Button variant="ghost" onClick={signOut} type="button">
              {t.signOut}
            </Button>
          </div>
        </div>
      </header>

      {err && (
        <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {err}
        </div>
      )}

      {busy ? (
        <div className="text-sm text-slate-600">{lang === "ar" ? "جارٍ تحميل الاستشارات..." : "Loading consultations..."}</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-slate-600">{lang === "ar" ? "لا توجد استشارات بعد." : "No consultations yet."}</div>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <Card key={r.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={urgencyTone(r.urgency) as any}>
                      {r.urgency === "elective" ? t.elective : r.urgency === "urgent" ? t.urgent : t.veryUrgent}
                    </Pill>
                    <Pill tone={statusTone(r.status) as any}>
                      {r.status === "new" ? t.new : r.status === "in_progress" ? t.inProgress : t.closed}
                    </Pill>
                    <span className="text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleString(lang === "ar" ? "ar" : "en")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value as any)}
                    >
                      <option value="new">{t.new}</option>
                      <option value="in_progress">{t.inProgress}</option>
                      <option value="closed">{t.closed}</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-sm">
                  <div className="text-slate-500">{lang === "ar" ? "هاتف الطبيب" : "Doctor phone"}</div>
                  <div className="font-medium">{r.doctor_phone}</div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-semibold">{lang === "ar" ? "المرضى" : "Patients"}</div>
                  {r.patients?.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-slate-100 p-3">
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-slate-600">
                          {p.location === "Other" ? (p.location_other || "Other") : p.location}
                        </div>
                      </div>
                      {p.case_summary && (
                        <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{p.case_summary}</div>
                      )}
                    </div>
                  ))}
                </div>

                {r.attachments?.length ? (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">{lang === "ar" ? "المرفقات" : "Attachments"}</div>
                    <ul className="space-y-1">
                      {r.attachments.map((a) => (
                        <li key={a.id} className="text-sm">
                          <button
                            className="underline"
                            onClick={async () => {
                              const url = await getPublicUrl(a.file_path);
                              window.open(url, "_blank", "noopener,noreferrer");
                            }}
                            type="button"
                          >
                            {lang === "ar" ? "فتح: " : "Open: "}
                            {a.file_name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
