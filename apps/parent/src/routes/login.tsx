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
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-10 text-white bg-gradient-to-br from-sky-600 via-indigo-600 to-violet-600">
        <div className="relative font-semibold tracking-tight">SekolahPro · Orang Tua</div>
        <div className="relative space-y-4 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Pantau perkembangan anak Anda.</h1>
          <p className="text-white/80 text-lg">Nilai, kehadiran, jadwal, pesan, dan tagihan — satu portal untuk semua anak.</p>
        </div>
        <p className="relative text-sm text-white/70">© {new Date().getFullYear()} SekolahPro</p>
      </aside>
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-fg">Masuk ke akun orang tua</h2>
            <p className="text-sm text-muted-fg">Gunakan kredensial yang diberikan sekolah.</p>
          </div>
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium text-fg">Username</label>
              <Input id="username" type="text" autoComplete="username" value={usr} onChange={(e) => setUsr(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-fg">Kata sandi</label>
                <button type="button" onClick={() => setShowPwd((v) => !v)} className="text-xs text-muted-fg hover:text-fg">
                  {showPwd ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
              <Input id="password" type={showPwd ? "text" : "password"} autoComplete="current-password" value={pwd} onChange={(e) => setPwd(e.target.value)} required />
            </div>
            {error ? (
              <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
            ) : null}
            <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-sky-600 to-violet-600 hover:opacity-95 disabled:opacity-60">
              {loading ? "Memuat..." : "Masuk"}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-fg">Lupa kata sandi? Hubungi admin sekolah.</p>
        </div>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/login")({ component: LoginPage });
