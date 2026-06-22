import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Input } from "@sekolahpro/ui";
import { login } from "@sekolahpro/auth";

function LoginPage() {
  const navigate = useNavigate();
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(usr, pwd);
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-bg">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-10 text-white bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600">
        <div aria-hidden className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-fuchsia-300/30 blur-3xl" />

        <div className="relative flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </span>
          SekolahPro · Guru &amp; Staff
        </div>

        <div className="relative space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Layanan mandiri kepegawaian.</h1>
          <p className="text-white/80 text-lg">
            Ajukan cuti, pantau saldo, lihat absensi dan SK Anda — dalam satu tempat.
          </p>
          <ul className="space-y-3 text-white/90">
            {["Ajukan & pantau cuti", "Rekap absensi pribadi", "Arsip SK Mengajar / Jabatan"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/70">© {new Date().getFullYear()} SekolahPro</p>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-fg">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Portal Guru &amp; Staff
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-fg">Masuk ke akun pegawai</h2>
            <p className="text-sm text-muted-fg">
              Gunakan username atau email dan kata sandi akun sekolah Anda.
            </p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium text-fg">Username</label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="username atau email"
                value={usr}
                onChange={(e) => setUsr(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-fg">Kata sandi</label>
                <button type="button" onClick={() => setShowPwd((v) => !v)} className="text-xs text-muted-fg hover:text-fg">
                  {showPwd ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
              />
            </div>

            {error ? (
              <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Memuat..." : "Masuk"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-fg">
            Lupa kata sandi? Hubungi admin sekolah / Tata Usaha.
          </p>
        </div>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/login")({ component: LoginPage });
