import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { login } from "@sekolahpro/auth";
import { Button } from "@sekolahpro/ui";

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
    <form onSubmit={submit} className="max-w-sm mx-auto p-6 flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Merchant Login</h1>
      <input
        className="border p-2 rounded"
        placeholder="Username"
        value={u}
        onChange={(e) => setU(e.target.value)}
      />
      <input
        className="border p-2 rounded"
        type="password"
        placeholder="Password"
        value={p}
        onChange={(e) => setP(e.target.value)}
      />
      <input
        className="border p-2 rounded"
        placeholder="Pairing code (6 digit)"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={6}
      />
      <Button type="submit">Masuk</Button>
      {err && (
        <div role="alert" className="text-red-600 text-sm">
          {err}
        </div>
      )}
    </form>
  );
}

export const Route = createFileRoute("/login")({ component: LoginPage });
