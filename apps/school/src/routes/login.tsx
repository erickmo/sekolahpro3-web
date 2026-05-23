import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Input, Card } from "@sekolahpro/ui";
import { login } from "@sekolahpro/auth";

function LoginPage() {
  const navigate = useNavigate();
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
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
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Masuk SekolahPro</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input type="email" placeholder="Email" value={usr} onChange={(e) => setUsr(e.target.value)} required />
          <Input type="password" placeholder="Kata sandi" value={pwd} onChange={(e) => setPwd(e.target.value)} required />
          {err && <p className="text-danger text-sm">{err}</p>}
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Memproses..." : "Masuk"}</Button>
        </form>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/login")({ component: LoginPage });
