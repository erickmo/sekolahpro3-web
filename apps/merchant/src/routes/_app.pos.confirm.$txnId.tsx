import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { merchantApi, type MerchantTxn } from "../lib/merchant-api";
import { ReceiptSheet } from "../components/ReceiptSheet";

const AUTO_CLEAR_MS = 5000;

function ConfirmPage() {
  const { txnId } = useParams({ from: "/_app/pos/confirm/$txnId" });
  const nav = useNavigate();
  const qc = useQueryClient();
  const txns = useQuery({ queryKey: ["transaksi"], queryFn: merchantApi.listTransaksi });
  const t: MerchantTxn | undefined = txns.data?.find((x) => x.name === txnId);
  const voidMut = useMutation({
    mutationFn: () => merchantApi.void(txnId, "operator request"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transaksi"] });
      nav({ to: "/pos" });
    },
  });

  useEffect(() => {
    const id = setTimeout(() => nav({ to: "/pos" }), AUTO_CLEAR_MS);
    return () => clearTimeout(id);
  }, [nav]);

  if (!t) return <div className="p-4">Memuat…</div>;
  return (
    <ReceiptSheet
      txnId={t.name}
      namaSiswa={t.nama_siswa ?? t.kartu}
      nominal={t.nominal}
      balanceAfter={0}
      voidDeadlineIso={t.void_deadline_iso}
      onClose={() => nav({ to: "/pos" })}
      onVoid={() => voidMut.mutate()}
    />
  );
}

export const Route = createFileRoute("/_app/pos/confirm/$txnId")({
  component: ConfirmPage,
});
