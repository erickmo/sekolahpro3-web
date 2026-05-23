import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, Button, Input } from "@sekolahpro/ui";
import { login } from "@sekolahpro/auth";

function LoginPage() {
  const navigate = useNavigate();
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
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
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Masuk Siswa</h1>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Input
            type="email"
            placeholder="Email"
            value={usr}
            onChange={(e) => setUsr(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Kata sandi"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            required
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Memuat..." : "Masuk"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/login")({ component: LoginPage });
