import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@sekolahpro/ui";
import { merchantApi } from "../lib/merchant-api";

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const formatTime = (iso: string) => new Date(iso).toLocaleString("id-ID");

function TransaksiDetailPage() {
  const { name } = useParams({ from: "/_app/transaksi/$name" });
  const nav = useNavigate();
  const qc = useQueryClient();
  const [err, setErr] = useState<string | null>(null);

  const q = useQuery({ queryKey: ["transaksi"], queryFn: merchantApi.listTransaksi });
  const t = q.data?.find((x) => x.name === name);

  const voidMut = useMutation({
    mutationFn: () => merchantApi.void(name, "operator request"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transaksi"] });
      nav({ to: "/transaksi" });
    },
    onError: (e) => setErr((e as Error).message),
  });

  if (q.isLoading) return <div className="p-4">Memuat…</div>;
  if (!t) return <div className="p-4">Transaksi tidak ditemukan.</div>;

  const canVoid =
    t.status === "Bayar" && new Date(t.void_deadline_iso).getTime() > Date.now();

  return (
    <div className="p-4 flex flex-col gap-3 max-w-md">
      <h1 className="text-xl font-semibold">{t.name}</h1>

      <div className="flex flex-col gap-1 text-sm">
        <div>
          <span className="text-muted-fg">Tanggal: </span>
          <span>{formatTime(t.tanggal)}</span>
        </div>
        <div>
          <span className="text-muted-fg">Kartu: </span>
          <span>{t.kartu}</span>
        </div>
        {t.nama_siswa && (
          <div>
            <span className="text-muted-fg">Nama: </span>
            <span>{t.nama_siswa}</span>
          </div>
        )}
        <div>
          <span className="text-muted-fg">Terminal: </span>
          <span className="font-mono text-xs">{t.terminal_id}</span>
        </div>
        <div>
          <span className="text-muted-fg">Status: </span>
          <span className={t.status === "Void" ? "text-red-600" : "text-emerald-600"}>
            {t.status}
          </span>
        </div>
        <div>
          <span className="text-muted-fg">Batas void: </span>
          <span>{formatTime(t.void_deadline_iso)}</span>
        </div>
      </div>

      <h2 className="text-lg font-semibold mt-2">Items</h2>
      <table className="w-full text-sm">
        <thead className="text-left border-b">
          <tr>
            <th className="py-1">Item</th>
            <th className="py-1 text-right">Qty</th>
            <th className="py-1 text-right">Harga</th>
            <th className="py-1 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {t.items.map((it, i) => (
            <tr key={`${it.name}-${i}`} className="border-b">
              <td className="py-1">{it.name}</td>
              <td className="py-1 text-right tabular-nums">{it.qty}</td>
              <td className="py-1 text-right tabular-nums">{formatRp(it.price)}</td>
              <td className="py-1 text-right tabular-nums">
                {formatRp(it.price * it.qty)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="pt-2 text-right font-semibold">
              Total
            </td>
            <td className="pt-2 text-right font-semibold tabular-nums">
              {formatRp(t.nominal)}
            </td>
          </tr>
        </tfoot>
      </table>

      {err && (
        <div role="alert" className="text-red-600 text-sm">
          {err}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <Button type="button" variant="ghost" onClick={() => nav({ to: "/transaksi" })}>
          Kembali
        </Button>
        {canVoid && (
          <Button
            type="button"
            variant="destructive"
            disabled={voidMut.isPending}
            onClick={() => {
              if (confirm("Void transaksi ini?")) voidMut.mutate();
            }}
          >
            {voidMut.isPending ? "Memproses…" : "Void"}
          </Button>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_app/transaksi/$name")({
  component: TransaksiDetailPage,
});
