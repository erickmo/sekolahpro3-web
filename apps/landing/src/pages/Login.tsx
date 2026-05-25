import { Link } from "react-router-dom";

const SCHOOL_URL =
  (import.meta.env.VITE_SCHOOL_LOGIN_URL as string | undefined) ??
  "http://localhost:5174/login";
const STUDENT_URL =
  (import.meta.env.VITE_STUDENT_LOGIN_URL as string | undefined) ??
  "http://localhost:5175/login";

interface Target {
  key: string;
  label: string;
  tagline: string;
  description: string;
  audience: string;
  href: string;
  badge: string;
}

const TARGETS: Target[] = [
  {
    key: "school",
    label: "Administrasi Sekolah",
    tagline: "Sistem informasi sekolah",
    description:
      "Untuk kepala sekolah, guru, dan staf tata usaha. Kelola jadwal, nilai, presensi, dan keuangan.",
    audience: "Kepala sekolah · Guru · Tata usaha",
    href: SCHOOL_URL,
    badge: "01",
  },
  {
    key: "student",
    label: "Siswa",
    tagline: "Portal pembelajaran siswa",
    description:
      "Akses jadwal pelajaran, tugas, nilai, dan pengumuman. Untuk siswa aktif SekolahPro.",
    audience: "Siswa · Wali siswa",
    href: STUDENT_URL,
    badge: "02",
  },
];

export function Login() {
  return (
    <section className="relative">
      <div className="hatch absolute -top-12 -right-10 w-72 h-72 rotate-6 opacity-50 pointer-events-none" aria-hidden />

      <div className="mx-auto max-w-[1100px] px-6 lg:px-10 py-20 lg:py-28">
        <header className="max-w-3xl">
          <div className="rule-label mb-5">Masuk · Pilih dasbor</div>
          <h1 className="font-display text-5xl lg:text-6xl tracking-tight leading-[0.95]">
            Mau masuk ke{" "}
            <em className="not-italic text-brand">dasbor</em> yang mana?
          </h1>
          <p className="mt-6 text-fg/75 text-lg max-w-2xl">
            SekolahPro punya dua pintu masuk. Pilih sesuai peran kamu — kami antar
            ke layar login yang tepat.
          </p>
        </header>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {TARGETS.map((t) => (
            <a
              key={t.key}
              href={t.href}
              className="group relative block border border-fg/20 bg-bg p-7 lg:p-8 transition-colors hover:border-brand hover:bg-brand/[0.03]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-xs tracking-widest text-fg/50">
                  {t.badge} / {String(TARGETS.length).padStart(2, "0")}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-fg/50 group-hover:text-brand">
                  Masuk →
                </span>
              </div>

              <div className="mt-6">
                <div className="rule-label mb-3">{t.tagline}</div>
                <h2 className="font-display text-3xl lg:text-4xl tracking-tight leading-tight">
                  {t.label}
                </h2>
              </div>

              <p className="mt-5 text-fg/75 leading-relaxed">{t.description}</p>

              <div className="mt-6 pt-5 border-t border-fg/15">
                <div className="font-mono text-[11px] uppercase tracking-widest text-fg/55">
                  Cocok untuk
                </div>
                <div className="mt-1.5 text-sm text-fg/85">{t.audience}</div>
              </div>

              <span
                className="absolute inset-x-0 -bottom-px h-px bg-brand scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"
                aria-hidden
              />
            </a>
          ))}
        </div>

        <footer className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-fg/65">
          <span>Belum punya akun?</span>
          <Link to="/kontak?utm=login" className="underline underline-offset-4 hover:text-brand">
            Hubungi tim kami
          </Link>
          <span aria-hidden className="text-fg/30">·</span>
          <Link to="/" className="underline underline-offset-4 hover:text-brand">
            Kembali ke beranda
          </Link>
        </footer>
      </div>
    </section>
  );
}
