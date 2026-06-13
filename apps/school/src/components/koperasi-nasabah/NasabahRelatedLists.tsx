import { Link, useParams } from "@tanstack/react-router";
import { Badge, DataTable, SectionCard, type Column } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";

interface RekeningRow {
  name: string;
  produk_simpanan?: string;
  saldo?: number;
  status?: string;
}

interface AkadRow {
  name: string;
  produk_pembiayaan?: string;
  jumlah_pokok?: number;
  status?: string;
}

const REKENING_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Aktif: "success",
  Dormant: "warning",
  Diblokir: "danger",
  Tutup: "neutral",
};

const AKAD_TONE: Record<string, "brand" | "success" | "danger" | "neutral"> = {
  Aktif: "brand",
  Lunas: "success",
  Macet: "danger",
};

function rupiah(n: number | undefined): string {
  return n !== undefined ? `Rp ${n.toLocaleString("id-ID")}` : "—";
}

/**
 * Rekening + akad milik satu nasabah — ringkas, link ke halaman detailnya.
 * Dipisah dari route supaya halaman detail tetap tipis (<300 baris).
 */
export function NasabahRelatedLists({ nasabah }: { nasabah: string }) {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });
  const rekeningQ = useResourceList<RekeningRow>("Rekening Simpanan", {
    fields: ["name", "produk_simpanan", "saldo", "status"],
    filters: [["nasabah", "=", nasabah]],
    limit_page_length: 20,
  });
  const akadQ = useResourceList<AkadRow>("Akad Pembiayaan", {
    fields: ["name", "produk_pembiayaan", "jumlah_pokok", "status"],
    filters: [["nasabah", "=", nasabah]],
    limit_page_length: 20,
  });

  const rekeningCols: Column<RekeningRow>[] = [
    { key: "name", header: "Rekening", cell: (r) => (
      <Link to="/kop/$sekolah/rekening/$name" params={{ sekolah, name: r.name }} className="font-mono text-xs text-brand hover:underline">
        {r.name}
      </Link>
    ) },
    { key: "produk_simpanan", header: "Produk", cell: (r) => r.produk_simpanan ?? "—" },
    { key: "saldo", header: "Saldo", align: "right", cell: (r) => <span className="tabular-nums">{rupiah(r.saldo)}</span> },
    { key: "status", header: "Status", cell: (r) => r.status ? <Badge tone={REKENING_TONE[r.status] ?? "neutral"} dot>{r.status}</Badge> : "—" },
  ];

  const akadCols: Column<AkadRow>[] = [
    { key: "name", header: "Akad", cell: (r) => (
      <Link to="/kop/$sekolah/pembiayaan/$name" params={{ sekolah, name: r.name }} className="font-mono text-xs text-brand hover:underline">
        {r.name}
      </Link>
    ) },
    { key: "produk_pembiayaan", header: "Produk", cell: (r) => r.produk_pembiayaan ?? "—" },
    { key: "jumlah_pokok", header: "Pokok", align: "right", cell: (r) => <span className="tabular-nums">{rupiah(r.jumlah_pokok)}</span> },
    { key: "status", header: "Status", cell: (r) => r.status ? <Badge tone={AKAD_TONE[r.status] ?? "neutral"} dot>{r.status}</Badge> : "—" },
  ];

  return (
    <>
      <SectionCard title="Rekening Simpanan" description={`${rekeningQ.data?.length ?? 0} rekening`} padded={false}>
        <DataTable
          data={rekeningQ.data ?? []}
          columns={rekeningCols}
          rowKey={(r) => r.name}
          empty={<div className="text-sm text-muted-fg">{rekeningQ.isLoading ? "Memuat…" : "Belum ada rekening."}</div>}
        />
      </SectionCard>
      <SectionCard title="Akad Pembiayaan" description={`${akadQ.data?.length ?? 0} akad`} padded={false}>
        <DataTable
          data={akadQ.data ?? []}
          columns={akadCols}
          rowKey={(r) => r.name}
          empty={<div className="text-sm text-muted-fg">{akadQ.isLoading ? "Memuat…" : "Belum ada akad."}</div>}
        />
      </SectionCard>
    </>
  );
}
