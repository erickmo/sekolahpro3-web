import { useEffect, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export interface KontakContent {
  hero_eyebrow: string;
  hero_title_main: string;
  hero_title_italic: string;
  hero_lead: string;
  field_label_nama: string;
  field_label_email: string;
  field_label_telepon: string;
  field_label_sekolah: string;
  field_label_jenjang: string;
  field_label_pesan: string;
  field_placeholder_telepon: string;
  field_placeholder_pesan: string;
  submit_label: string;
  submit_label_busy: string;
  consent_note: string;
  success_title: string;
  success_body: string;
  success_again_label: string;
}

export const STATIC_FALLBACK: KontakContent = {
  hero_eyebrow: "— Kontak",
  hero_title_main: "Mari mulai dari",
  hero_title_italic: "satu obrolan.",
  hero_lead:
    "Isi formulir di bawah, atau hubungi kami via WhatsApp. Kami balas paling lambat 1×24 jam kerja.",
  field_label_nama: "Nama lengkap",
  field_label_email: "Email",
  field_label_telepon: "Telepon / WhatsApp",
  field_label_sekolah: "Nama sekolah",
  field_label_jenjang: "Jenjang",
  field_label_pesan: "Pesan (opsional)",
  field_placeholder_telepon: "08xxxxxxxx",
  field_placeholder_pesan: "Ceritakan singkat kebutuhan sekolah Anda.",
  submit_label: "Kirim pesan",
  submit_label_busy: "Mengirim…",
  consent_note:
    "Dengan mengirim formulir ini, Anda setuju kami menghubungi Anda terkait pertanyaan ini.",
  success_title: "Terima kasih!",
  success_body:
    "Pesan Anda sudah kami terima. Tim SekolahPro akan menghubungi Anda dalam 1×24 jam kerja.",
  success_again_label: "Kirim pesan lain",
};

interface ApiShape {
  hero_eyebrow?: string;
  hero_title_main?: string;
  hero_title_italic?: string;
  hero_lead?: string;
  field_label_nama?: string;
  field_label_email?: string;
  field_label_telepon?: string;
  field_label_sekolah?: string;
  field_label_jenjang?: string;
  field_label_pesan?: string;
  field_placeholder_telepon?: string;
  field_placeholder_pesan?: string;
  submit_label?: string;
  submit_label_busy?: string;
  consent_note?: string;
  success_title?: string;
  success_body?: string;
  success_again_label?: string;
}

function map(raw: ApiShape): KontakContent {
  return {
    hero_eyebrow: raw.hero_eyebrow ?? STATIC_FALLBACK.hero_eyebrow,
    hero_title_main: raw.hero_title_main ?? STATIC_FALLBACK.hero_title_main,
    hero_title_italic: raw.hero_title_italic ?? STATIC_FALLBACK.hero_title_italic,
    hero_lead: raw.hero_lead ?? STATIC_FALLBACK.hero_lead,
    field_label_nama: raw.field_label_nama ?? STATIC_FALLBACK.field_label_nama,
    field_label_email: raw.field_label_email ?? STATIC_FALLBACK.field_label_email,
    field_label_telepon: raw.field_label_telepon ?? STATIC_FALLBACK.field_label_telepon,
    field_label_sekolah: raw.field_label_sekolah ?? STATIC_FALLBACK.field_label_sekolah,
    field_label_jenjang: raw.field_label_jenjang ?? STATIC_FALLBACK.field_label_jenjang,
    field_label_pesan: raw.field_label_pesan ?? STATIC_FALLBACK.field_label_pesan,
    field_placeholder_telepon:
      raw.field_placeholder_telepon ?? STATIC_FALLBACK.field_placeholder_telepon,
    field_placeholder_pesan:
      raw.field_placeholder_pesan ?? STATIC_FALLBACK.field_placeholder_pesan,
    submit_label: raw.submit_label ?? STATIC_FALLBACK.submit_label,
    submit_label_busy: raw.submit_label_busy ?? STATIC_FALLBACK.submit_label_busy,
    consent_note: raw.consent_note ?? STATIC_FALLBACK.consent_note,
    success_title: raw.success_title ?? STATIC_FALLBACK.success_title,
    success_body: raw.success_body ?? STATIC_FALLBACK.success_body,
    success_again_label: raw.success_again_label ?? STATIC_FALLBACK.success_again_label,
  };
}

export function useKontakContent(): KontakContent {
  const [content, setContent] = useState<KontakContent>(STATIC_FALLBACK);
  useEffect(() => {
    if (!API_BASE) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/method/sekolahpro.api.kontak_page.get_content`, {
      credentials: "omit",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: { message?: ApiShape }) => {
        if (cancelled || !body?.message) return;
        setContent(map(body.message));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return content;
}
