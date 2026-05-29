import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { logout } from "@sekolahpro/auth";
import { useMerchantContext } from "../lib/merchant-session";
import { OperatorPinModal } from "../components/OperatorPinModal";

function PengaturanPage() {
  const ctx = useMerchantContext();
  const nav = useNavigate();
  const [pinOpen, setPinOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logout();
    } finally {
      setBusy(false);
      nav({ to: "/login" });
    }
  };

  return (
    <div className="p-4 flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Pengaturan</h1>
      <div>
        <div className="text-sm text-muted-fg">Merchant</div>
        <div className="font-semibold">{ctx.merchantId}</div>
      </div>
      <div>
        <div className="text-sm text-muted-fg">Terminal</div>
        <div className="font-mono text-xs">{ctx.terminalId}</div>
      </div>
      <div>
        <div className="text-sm text-muted-fg">Operator</div>
        <div>{ctx.operatorUser ?? "—"}</div>
      </div>
      <button
        type="button"
        onClick={() => setPinOpen(true)}
        className="border rounded p-2 text-left"
      >
        Ganti operator
      </button>
      <button
        type="button"
        onClick={handleLogout}
        disabled={busy}
        className="border rounded p-2 text-left text-red-600 disabled:opacity-50"
      >
        {busy ? "Keluar…" : "Logout"}
      </button>
      {pinOpen && (
        <OperatorPinModal
          onCancel={() => setPinOpen(false)}
          onConfirm={() => setPinOpen(false)}
        />
      )}
    </div>
  );
}

export const Route = createFileRoute("/_app/pengaturan")({ component: PengaturanPage });
