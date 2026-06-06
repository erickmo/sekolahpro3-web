// ABS-002 — Layar login guru (mode kelas).
//
// Untuk mode kelas, seorang guru masuk dengan kredensialnya sendiri di
// perangkat stasiun. `LoginView` murni & prop-injected agar dapat diuji tanpa
// jaringan; `LoginRoute` membungkusnya dengan `login` nyata dari @sekolahpro/auth.
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { login } from "@sekolahpro/auth";
import { Alert, Button, Input, PageHeader, SectionCard } from "@sekolahpro/ui";

/** Pesan error generik saat login gagal. */
const LOGIN_ERROR_MESSAGE = "Gagal masuk. Periksa nama pengguna dan kata sandi.";

export interface LoginViewProps {
  /** Melakukan login; di-inject supaya dapat diuji. */
  onLogin: (usr: string, pwd: string) => Promise<void>;
}

/**
 * Form login guru: input nama pengguna + kata sandi + tombol submit. Saat
 * submit, panggil `onLogin(usr, pwd)`. Tombol dinonaktifkan selama proses;
 * penolakan menampilkan `Alert tone="danger"` (role=alert).
 *
 * @param props.onLogin - handler login (injected).
 */
export function LoginView({ onLogin }: LoginViewProps) {
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await onLogin(usr, pwd);
    } catch {
      setError(LOGIN_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-5 p-6">
      <PageHeader
        eyebrow="Mode Kelas"
        title="Masuk Guru"
        description="Masuk dengan akun Anda untuk mencatat kehadiran kelas."
      />
      <SectionCard title="Akun Guru">
        <form className="space-y-4" onSubmit={submit}>
          {error ? (
            <Alert tone="danger" title="Tidak dapat masuk">
              {error}
            </Alert>
          ) : null}
          <div className="space-y-1.5">
            <label htmlFor="login-usr" className="text-sm font-medium text-fg">
              Nama pengguna
            </label>
            <Input
              id="login-usr"
              value={usr}
              onChange={(e) => setUsr(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="login-pwd" className="text-sm font-medium text-fg">
              Kata sandi
            </label>
            <Input
              id="login-pwd"
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Memproses…" : "Masuk"}
          </Button>
        </form>
      </SectionCard>
    </div>
  );
}

/** Wrapper rute: men-inject `onLogin` nyata via @sekolahpro/auth `login`. */
function LoginRoute() {
  return <LoginView onLogin={(usr, pwd) => login(usr, pwd)} />;
}

export const Route = createFileRoute("/login")({ component: LoginRoute });
