"use client";

import React, { useMemo, useState } from "react";
import { supabase, ATTACHMENTS_BUCKET } from "../lib/supabase";
import { Card, CardContent, CardHeader, Button, Input, Label, Textarea, Pill } from "../components/ui";
import { strings, type Lang } from "../lib/i18n";
import type { ConsultationDraft, PatientDraft, Urgency } from "../lib/types";

const defaultPatient = (): PatientDraft => ({
  name: "",
  location: "",
  locationOther: "",
  notes: ""
});

function isValidPhone(phone: string) {
  // very forgiving: digits, spaces, +, -, parentheses; at least 7 digits
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7;
}

export default function Page() {
  const [lang, setLang] = useState<Lang>("ar");
  const t = useMemo(() => strings[lang], [lang]);

  const [draft, setDraft] = useState<ConsultationDraft>({
    doctorPhone: "",
    urgency: "",
    patients: [defaultPatient()],
    attachments: []
  });

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const dir = lang === "ar" ? "rtl" : "ltr";

  function addPatient() {
    setDraft((d) => ({ ...d, patients: [...d.patients, defaultPatient()] }));
  }

  function removePatient(idx: number) {
    setDraft((d) => ({ ...d, patients: d.patients.filter((_, i) => i !== idx) }));
  }

  function clearForm() {
    setDraft({ doctorPhone: "", urgency: "", patients: [defaultPatient()], attachments: [] });
    setMsg(null);
    const input = document.getElementById("attachments") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  async function submit() {
    setMsg(null);

    // basic validation
    if (!draft.doctorPhone.trim()) return setMsg({ type: "err", text: `${t.doctorPhone}: ${t.required}` });
    if (!isValidPhone(draft.doctorPhone)) return setMsg({ type: "err", text: t.invalidPhone });
    if (!draft.urgency) return setMsg({ type: "err", text: `${t.urgency}: ${t.required}` });

    for (let i = 0; i < draft.patients.length; i++) {
      const p = draft.patients[i];
      if (!p.name.trim()) return setMsg({ type: "err", text: `${t.patientName} (${i + 1}): ${t.required}` });
      if (!p.location) return setMsg({ type: "err", text: `${t.patientLocation} (${i + 1}): ${t.required}` });
      if (p.location === "Other" && !(p.locationOther || "").trim()) {
        return setMsg({ type: "err", text: `${t.otherSpecify} (${i + 1}): ${t.required}` });
      }
    }

    setBusy(true);
    try {
      // 1) create consultation
      const { data: consultation, error: cErr } = await supabase
        .from("consultations")
        .insert({
          doctor_phone: draft.doctorPhone.trim(),
          urgency: draft.urgency,
          status: "new"
        })
        .select("id")
        .single();

      if (cErr) throw cErr;
      const consultationId = consultation.id as string;

      // 2) insert patients
      const patientsPayload = draft.patients.map((p) => ({
        consultation_id: consultationId,
        name: p.name.trim(),
        location: p.location,
        location_other: p.location === "Other" ? (p.locationOther || "").trim() : null,
        case_summary: p.notes.trim()
      }));

      const { error: pErr } = await supabase.from("patients").insert(patientsPayload);
      if (pErr) throw pErr;

      // 3) upload attachments + write metadata
      if (draft.attachments.length) {
        const metas: any[] = [];
        for (const file of draft.attachments) {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${consultationId}/${Date.now()}_${safeName}`;
          const { error: upErr } = await supabase.storage.from(ATTACHMENTS_BUCKET).upload(path, file, {
            cacheControl: "3600",
            upsert: false
          });
          if (upErr) throw upErr;

          metas.push({
            consultation_id: consultationId,
            file_path: path,
            file_name: file.name,
            mime_type: file.type || null,
            size_bytes: file.size
          });
        }

        const { error: aErr } = await supabase.from("attachments").insert(metas);
        if (aErr) throw aErr;
      }

      setMsg({ type: "ok", text: t.success });
      clearForm();
    } catch (e: any) {
      console.error(e);
      setMsg({ type: "err", text: t.error });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-4 md:p-8" dir={dir}>
      <header className="mb-4 md:mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{t.title}</h1>
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
        </div>
      </header>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{t.patientInfo}</h2>
            <Button variant="secondary" onClick={addPatient} type="button">
              {t.addPatient}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {draft.patients.map((p, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-100 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Pill>{lang === "ar" ? `مريض ${idx + 1}` : `Patient ${idx + 1}`}</Pill>
                </div>
                {draft.patients.length > 1 && (
                  <Button variant="ghost" onClick={() => removePatient(idx)} type="button">
                    {lang === "ar" ? "إزالة" : "Remove"}
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>{t.patientName}</Label>
                  <Input
                    value={p.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDraft((d) => {
                        const patients = [...d.patients];
                        patients[idx] = { ...patients[idx], name: v };
                        return { ...d, patients };
                      });
                    }}
                    placeholder={lang === "ar" ? "اكتب اسم المريض" : "Enter patient name"}
                  />
                </div>

                <div>
                  <Label>{t.patientLocation}</Label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                    value={p.location}
                    onChange={(e) => {
                      const v = e.target.value as PatientDraft["location"];
                      setDraft((d) => {
                        const patients = [...d.patients];
                        patients[idx] = { ...patients[idx], location: v };
                        return { ...d, patients };
                      });
                    }}
                  >
                    <option value="">{lang === "ar" ? "اختر المكان" : "Choose location"}</option>
                    <option value="ICU">{lang === "ar" ? "العناية المركزة" : "ICU"}</option>
                    <option value="Medical ward">{lang === "ar" ? "القسم الباطني" : "Medical ward"}</option>
                    <option value="Surgical ward">{lang === "ar" ? "القسم الجراحي" : "Surgical ward"}</option>
                    <option value="OBGYN">{lang === "ar" ? "النسائية والتوليد" : "OBGYN"}</option>
                    <option value="Other">{lang === "ar" ? "أخرى" : "Other"}</option>
                  </select>

                  {p.location === "Other" && (
                    <div className="mt-2">
                      <Label className="text-xs text-slate-600">{t.otherSpecify}</Label>
                      <Input
                        value={p.locationOther || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDraft((d) => {
                            const patients = [...d.patients];
                            patients[idx] = { ...patients[idx], locationOther: v };
                            return { ...d, patients };
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Label>{t.caseNotes}</Label>
                <Textarea
                  value={p.notes}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft((d) => {
                      const patients = [...d.patients];
                      patients[idx] = { ...patients[idx], notes: v };
                      return { ...d, patients };
                    });
                  }}
                  placeholder={
                    lang === "ar"
                      ? "اشرح الحالة باختصار (الأعراض، العلامات الحيوية، أهم النتائج)"
                      : "Brief summary (symptoms, vitals, key findings)"
                  }
                />
              </div>
            </div>
          ))}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>{t.urgency}</Label>
              <div className="mt-2 grid gap-2">
                {[
                  { value: "elective", label: t.elective },
                  { value: "urgent", label: t.urgent },
                  { value: "very_urgent", label: t.veryUrgent }
                ].map((x) => (
                  <label key={x.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
                    <input
                      type="radio"
                      name="urgency"
                      checked={draft.urgency === (x.value as Urgency)}
                      onChange={() => setDraft((d) => ({ ...d, urgency: x.value as Urgency }))}
                    />
                    <span className="text-sm">{x.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>{t.doctorContact}</Label>
              <div className="mt-2">
                <Label className="text-xs text-slate-600">{t.doctorPhone}</Label>
                <Input
                  value={draft.doctorPhone}
                  onChange={(e) => setDraft((d) => ({ ...d, doctorPhone: e.target.value }))}
                  placeholder={lang === "ar" ? "مثال: 05X XXX XXXX" : "e.g., +970…"}
                />
                <p className="mt-1 text-xs text-slate-500">{t.phoneHint}</p>
              </div>

              <div className="mt-4">
                <Label>{t.attachments}</Label>
                <p className="mt-1 text-xs text-slate-500">{t.uploadHint}</p>
                <input
                  id="attachments"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="mt-2 block w-full text-sm"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setDraft((d) => ({ ...d, attachments: files }));
                  }}
                />
              </div>
            </div>
          </div>

          {msg && (
            <div
              className={
                msg.type === "ok"
                  ? "rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                  : "rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              }
            >
              {msg.text}
            </div>
          )}

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-slate-600">
              <div>{t.thanks}</div>
              <div className="text-slate-500">{t.thanksEn}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={clearForm} type="button" disabled={busy}>
                {t.clear}
              </Button>
              <Button onClick={submit} type="button" disabled={busy}>
                {busy ? (lang === "ar" ? "جارٍ الإرسال..." : "Submitting...") : t.submit}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-xs text-slate-500">
        <a className="underline" href="/admin/login">
          {lang === "ar" ? "صفحة المشرف" : "Admin page"}
        </a>
      </div>
    </main>
  );
}
