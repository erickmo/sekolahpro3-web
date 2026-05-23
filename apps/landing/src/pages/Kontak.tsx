import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Card, Input } from "@sekolahpro/ui";

const JENJANG_OPTIONS = ["SD", "SMP", "SMA", "SMK", "MI", "MTs", "MA", "Lainnya"] as const;
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

interface FormState {
  nama: string;
  email: string;
  telepon: string;
  sekolah: string;
  jenjang: string;
  pesan: string;
  hp: string; // honeypot
}

const INITIAL: FormState = {
  nama: "",
  email: "",
  telepon: "",
  sekolah: "",
  jenjang: "",
  pesan: "",
  hp: "",
};

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "ok"; id: string }
  | { kind: "error"; message: string };

export function Kontak() {
  const [params] = useSearchParams();
  const utm = params.get("utm") ?? "";
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submit, setSubmit] = useState<SubmitState>({ kind: "idle" });

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.nama.trim()) e.nama = "Nama wajib diisi.";
    else if (form.nama.length > 120) e.nama = "Nama terlalu panjang (maks 120 karakter).";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Email tidak valid.";
    if (!/^[\d\s()+\-]{7,20}$/.test(form.telepon)) e.telepon = "Nomor telepon tidak valid.";
    if (!form.sekolah.trim()) e.sekolah = "Nama sekolah wajib diisi.";
    if (!form.jenjang) e.jenjang = "Pilih jenjang.";
    if (form.pesan.length > 2000) e.pesan = "Pesan terlalu panjang (maks 2000 karakter).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (form.hp) return; // honeypot tripped — silently drop
    if (!validate()) return;
    setSubmit({ kind: "submitting" });

    try {
      const res = await fetch(`${API_BASE}/api/method/sekolahpro.api.contact.submit_lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: form.nama.trim(),
          email: form.email.trim().toLowerCase(),
          telepon: form.telepon.trim(),
          sekolah: form.sekolah.trim(),
          jenjang: form.jenjang,
          pesan: form.pesan.trim(),
          utm,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: { ok: boolean; id: string }; exception?: string };
      if (!res.ok) {
        const message =
          body?.exception?.match(/ValidationError:\s*(.+)$/)?.[1] ??
          "Gagal mengirim. Silakan coba lagi.";
        setSubmit({ kind: "error", message });
        return;
      }
      setSubmit({ kind: "ok", id: body.message?.id ?? "" });
      setForm(INITIAL);
    } catch {
      setSubmit({ kind: "error", message: "Tidak dapat terhubung ke server. Coba lagi sebentar lagi." });
    }
  }

  if (submit.kind === "ok") {
    return (
      <section className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-brand/10 text-brand flex items-center justify-center text-2xl">✓</div>
        <h1 className="mt-6 text-3xl sm:text-4xl font-semibold text-fg">Terima kasih!</h1>
        <p className="mt-3 text-muted-fg">
          Pesan Anda sudah kami terima. Tim SekolahPro akan menghubungi Anda dalam 1×24 jam kerja.
        </p>
        <p className="mt-2 text-xs text-muted-fg">Nomor tiket: {submit.id || "—"}</p>
        <div className="mt-8">
          <Button onClick={() => setSubmit({ kind: "idle" })}>Kirim pesan lain</Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <p className="text-sm font-medium text-brand">— Kontak</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold text-fg leading-tight max-w-2xl">
            Mari mulai dari <em className="not-italic font-serif italic text-brand">satu obrolan.</em>
          </h1>
          <p className="mt-4 text-lg text-muted-fg max-w-2xl">
            Isi formulir di bawah, atau hubungi kami via WhatsApp. Kami balas paling lambat 1×24 jam kerja.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-[1fr_360px] items-start">
          <Card className="!p-6 sm:!p-8">
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              <input
                type="text"
                name="hp"
                tabIndex={-1}
                autoComplete="off"
                value={form.hp}
                onChange={(e) => update("hp", e.target.value)}
                className="absolute -left-[9999px] w-0 h-0 opacity-0"
                aria-hidden="true"
              />

              <Field label="Nama lengkap" error={errors.nama} required>
                <Input value={form.nama} onChange={(e) => update("nama", e.target.value)} autoComplete="name" required />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Email" error={errors.email} required>
                  <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" required />
                </Field>
                <Field label="Telepon / WhatsApp" error={errors.telepon} required>
                  <Input type="tel" value={form.telepon} onChange={(e) => update("telepon", e.target.value)} autoComplete="tel" required placeholder="08xxxxxxxx" />
                </Field>
              </div>

              <Field label="Nama sekolah" error={errors.sekolah} required>
                <Input value={form.sekolah} onChange={(e) => update("sekolah", e.target.value)} required />
              </Field>

              <Field label="Jenjang" error={errors.jenjang} required>
                <select
                  value={form.jenjang}
                  onChange={(e) => update("jenjang", e.target.value)}
                  required
                  className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="">Pilih jenjang…</option>
                  {JENJANG_OPTIONS.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </Field>

              <Field label="Pesan (opsional)" error={errors.pesan}>
                <textarea
                  value={form.pesan}
                  onChange={(e) => update("pesan", e.target.value)}
                  rows={5}
                  maxLength={2000}
                  className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-y"
                  placeholder="Ceritakan singkat kebutuhan sekolah Anda."
                />
                <div className="text-xs text-muted-fg text-right mt-1">{form.pesan.length} / 2000</div>
              </Field>

              {submit.kind === "error" && (
                <div className="rounded-md border border-danger/30 bg-danger/5 text-danger text-sm px-3 py-2">
                  {submit.message}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submit.kind === "submitting"}>
                {submit.kind === "submitting" ? "Mengirim…" : "Kirim pesan"}
              </Button>

              <p className="text-xs text-muted-fg">
                Dengan mengirim formulir ini, Anda setuju kami menghubungi Anda terkait pertanyaan ini.
              </p>
            </form>
          </Card>

          <aside className="space-y-4">
            <Card>
              <h3 className="font-semibold text-fg">WhatsApp</h3>
              <p className="mt-1 text-sm text-muted-fg">Senin–Jumat, 09.00–17.00 WIB.</p>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-brand font-medium hover:underline"
              >
                +62 812-3456-7890 →
              </a>
            </Card>
            <Card>
              <h3 className="font-semibold text-fg">Email</h3>
              <p className="mt-1 text-sm text-muted-fg">Untuk pertanyaan tidak mendesak.</p>
              <a href="mailto:halo@sekolahpro.id" className="mt-3 inline-block text-brand font-medium hover:underline">
                halo@sekolahpro.id →
              </a>
            </Card>
            <Card>
              <h3 className="font-semibold text-fg">Kantor</h3>
              <p className="mt-1 text-sm text-muted-fg">
                Sekolah Pro Indonesia<br />
                Jakarta Selatan, DKI Jakarta
              </p>
            </Card>
          </aside>
        </div>
      </section>
    </>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-fg mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      {children}
      {error && <span className="block text-xs text-danger mt-1.5">{error}</span>}
    </label>
  );
}
