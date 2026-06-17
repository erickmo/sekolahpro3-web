import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { login } from "@sekolahpro/auth";
import { Button, Input, Card, Alert } from "@sekolahpro/ui";

function LoginPage() {
  const nav = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      // @sekolahpro/auth login(usr, pwd) — pairing_code/scope reserved for
      // future merchant-scoped login flow (kept in the form so backend can
      // pick it up via an interceptor later without UI churn).
      void code;
      await login(u, p);
      nav({ to: "/pos" });
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  return (
    <div className="flex min-h-full items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
            SP
          </div>
          <h1 className="text-xl font-semibold text-fg">SekolahPro POS</h1>
          <p className="mt-1 text-sm text-muted-fg">Masuk untuk mulai transaksi</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-fg">
            Username
            <Input value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-fg">
            Password
            <Input
              type="password"
              value={p}
              onChange={(e) => setP(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-fg">
            Kode pairing
            <Input
              inputMode="numeric"
              placeholder="6 digit"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
            />
          </label>
          <Button type="submit" className="mt-2 h-12 w-full text-base">
            Masuk
          </Button>
          {err && (
            <Alert tone="danger" statusRole>
              {err}
            </Alert>
          )}
        </form>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/login")({ component: LoginPage });
