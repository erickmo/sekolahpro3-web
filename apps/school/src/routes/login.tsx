import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Input } from "@sekolahpro/ui";
import { login } from "@sekolahpro/auth";

function LoginPage() {
  const navigate = useNavigate();
  const [usr, setUsr] = useState("administrator");
  const [pwd, setPwd] = useState("123123123");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await login(usr, pwd);
      navigate({ to: "/" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Login gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-bg font-sans">
      {/* Left: brand panel */}
      <aside
        className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, hsl(222 89% 55%) 0%, hsl(262 83% 58%) 55%, hsl(292 76% 50%) 100%)",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 50% at 80% 20%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 60%), radial-gradient(50% 40% at 10% 90%, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 60%)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center font-bold text-lg ring-1 ring-white/25">
            S
          </div>
          <span className="text-lg font-semibold tracking-tight">SekolahPro</span>
        </div>

        <div className="relative space-y-6 max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Kelola sekolah Anda dengan satu portal.
          </h2>
          <p className="text-white/80 text-base leading-relaxed">
            Akademik, keuangan, presensi, dan komunikasi orang tua dalam satu
            platform yang cepat dan aman.
          </p>

          <ul className="space-y-3 text-sm text-white/90">
            {[
              "Dashboard real-time per kelas",
              "Integrasi penuh ERPNext & Frappe",
              "Akses guru, siswa, dan orang tua",
            ].map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="h-5 w-5 rounded-full bg-white/15 ring-1 ring-white/30 flex items-center justify-center text-[10px]">
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} SekolahPro · v1.0
        </p>
      </aside>

      {/* Right: form panel */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold"
              style={{
                background:
                  "linear-gradient(135deg, hsl(222 89% 55%), hsl(292 76% 50%))",
              }}
            >
              S
            </div>
            <span className="font-semibold tracking-tight">SekolahPro</span>
          </div>

          <header className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-fg">
              Selamat datang kembali
            </h1>
            <p className="mt-1 text-sm text-muted-fg">
              Masuk untuk membuka dashboard sekolah Anda.
            </p>
          </header>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <label className="block">
              <span className="block text-sm font-medium text-fg mb-1.5">
                Email
              </span>
              <Input
                type="email"
                autoComplete="email"
                placeholder="nama@sekolah.id"
                value={usr}
                onChange={(e) => setUsr(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-fg">Kata sandi</span>
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="text-xs text-brand hover:underline"
                >
                  {showPwd ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
              <Input
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
              />
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-fg cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
                Ingat saya
              </label>
              <a href="#" className="text-brand hover:underline">
                Lupa sandi?
              </a>
            </div>

            {err && (
              <div
                role="alert"
                className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {err}
              </div>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="w-full h-11 text-base shadow-sm"
              style={{
                background:
                  "linear-gradient(135deg, hsl(222 89% 55%), hsl(262 83% 58%))",
              }}
            >
              {busy ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-fg">
            Butuh akun? Hubungi admin sekolah Anda.
          </p>
        </div>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/login")({ component: LoginPage });
