import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Input } from "@sekolahpro/ui";
import { login } from "@sekolahpro/auth";

const APP_NAME = "SekolahPro";
const FALLBACK_ERROR = "Login gagal";

/**
 * Single-panel, centered login screen for the SaaS (provider) tier.
 *
 * Design notes:
 * - Deliberately NOT a left/right split panel — one focused card on a
 *   branded gradient backdrop keeps the provider sign-in calm and modern.
 * - Identifier field accepts username OR email (Frappe's `login` endpoint
 *   resolves both), so it is `type="text"`, not `type="email"`.
 */
function LoginPage() {
  const navigate = useNavigate();
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /**
   * Submit credentials to the auth service and route to the dashboard.
   * Surfaces a humane error message on failure; never throws to the UI.
   */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await login(usr, pwd);
      navigate({ to: "/" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : FALLBACK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-200 via-bg to-violet-200 flex items-center justify-center p-6">
      {/* Vibrant multi-hue glows — saturated mesh for a modern, lively backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-sky-400/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/4 -left-24 h-96 w-96 rounded-full bg-fuchsia-400/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 right-1/3 h-[26rem] w-[26rem] rounded-full bg-violet-500/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-10 -left-10 h-72 w-72 rounded-full bg-cyan-300/40 blur-3xl"
      />

      <main className="relative w-full max-w-md">
        {/* Brand mark + heading */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
              aria-hidden
            >
              <path d="M22 10 12 5 2 10l10 5 10-5Z" />
              <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">
            Masuk ke {APP_NAME}
          </h1>
          <p className="mt-1.5 text-sm text-muted-fg">
            Kelola seluruh sekolah Anda dalam satu platform.
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-border bg-bg/80 p-8 shadow-xl shadow-fg/5 backdrop-blur">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="usr" className="text-sm font-medium text-fg">
                Username atau email
              </label>
              <Input
                id="usr"
                type="text"
                autoComplete="username"
                placeholder="cth. admin atau admin@sekolah.id"
                value={usr}
                onChange={(e) => setUsr(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="pwd" className="text-sm font-medium text-fg">
                  Kata sandi
                </label>
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="text-xs font-medium text-muted-fg transition-colors hover:text-brand"
                >
                  {showPwd ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
              <Input
                id="pwd"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
              />
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
              size="lg"
              disabled={busy}
              className="w-full shadow-lg shadow-brand/20"
            >
              {busy ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-muted-fg">
          © {new Date().getFullYear()} {APP_NAME}. Semua hak dilindungi.
        </p>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/login")({ component: LoginPage });
