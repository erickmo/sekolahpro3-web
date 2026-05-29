import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@sekolahpro/ui";
import { merchantApi } from "../lib/merchant-api";

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

function CatalogIndexPage() {
  const q = useQuery({ queryKey: ["catalog", "all"], queryFn: merchantApi.listCatalog });
  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Katalog</h1>
        <Link to="/catalog/$name" params={{ name: "new" }}>
          <Button size="sm">+ Item baru</Button>
        </Link>
      </div>
      {q.isLoading && <div>Memuat…</div>}
      {q.data && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left border-b">
              <tr>
                <th className="py-2">Nama</th>
                <th className="py-2 text-right">Harga</th>
                <th className="py-2">Kategori</th>
                <th className="py-2">Aktif</th>
              </tr>
            </thead>
            <tbody>
              {q.data.map((it) => (
                <tr key={it.name} className="border-b hover:bg-muted">
                  <td className="py-2">
                    <Link
                      to="/catalog/$name"
                      params={{ name: it.name }}
                      className="text-brand underline"
                    >
                      {it.nama}
                    </Link>
                  </td>
                  <td className="py-2 text-right tabular-nums">{formatRp(it.harga)}</td>
                  <td className="py-2">{it.kategori_item}</td>
                  <td className="py-2">{it.aktif ? "Ya" : "Tidak"}</td>
                </tr>
              ))}
              {q.data.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-muted-fg">
                    Belum ada item.
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

export const Route = createFileRoute("/_app/catalog/")({ component: CatalogIndexPage });
