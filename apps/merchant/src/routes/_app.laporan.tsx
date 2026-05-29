import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { merchantApi } from "../lib/merchant-api";

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

function LaporanPage() {
  const q = useQuery({ queryKey: ["daily"], queryFn: merchantApi.dailyReport });
  if (!q.data) return <div className="p-4">Memuat…</div>;
  return (
    <div className="p-4 flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Laporan Hari Ini</h1>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded border p-3">
          <div className="text-sm text-muted-fg">Total transaksi</div>
          <div className="text-2xl tabular-nums">{q.data.total_transaksi}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-sm text-muted-fg">Total nominal</div>
          <div className="text-2xl tabular-nums">{formatRp(q.data.total_nominal)}</div>
        </div>
      </div>
      <h2 className="text-lg font-semibold">Per item</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Nama</th>
            <th className="py-2 text-right">Qty</th>
          </tr>
        </thead>
        <tbody>
          {q.data.by_item.map((r) => (
            <tr key={r.name} className="border-b">
              <td className="py-2">{r.nama}</td>
              <td className="py-2 text-right tabular-nums">{r.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Route = createFileRoute("/_app/laporan")({ component: LaporanPage });
