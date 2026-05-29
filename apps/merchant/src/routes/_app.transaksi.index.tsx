import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { merchantApi } from "../lib/merchant-api";

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const formatTime = (iso: string) => new Date(iso).toLocaleString("id-ID");

function TransaksiIndexPage() {
  const q = useQuery({ queryKey: ["transaksi"], queryFn: merchantApi.listTransaksi });
  return (
    <div className="p-4 flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Transaksi</h1>
      {q.isLoading && <div>Memuat…</div>}
      {q.data && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left border-b">
              <tr>
                <th className="py-2">Tanggal</th>
                <th className="py-2">Kartu/Nama</th>
                <th className="py-2 text-right">Items</th>
                <th className="py-2 text-right">Nominal</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {q.data.map((t) => (
                <tr key={t.name} className="border-b hover:bg-muted">
                  <td className="py-2">
                    <Link
                      to="/transaksi/$name"
                      params={{ name: t.name }}
                      className="text-brand underline"
                    >
                      {formatTime(t.tanggal)}
                    </Link>
                  </td>
                  <td className="py-2">{t.nama_siswa ?? t.kartu}</td>
                  <td className="py-2 text-right tabular-nums">{t.items.length}</td>
                  <td className="py-2 text-right tabular-nums">{formatRp(t.nominal)}</td>
                  <td className="py-2">
                    <span
                      className={
                        t.status === "Void" ? "text-red-600" : "text-emerald-600"
                      }
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {q.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-fg">
                    Belum ada transaksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/_app/transaksi/")({ component: TransaksiIndexPage });
