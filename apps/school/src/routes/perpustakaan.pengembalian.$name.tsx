import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@sekolahpro/ui";
import { useResourceDoc } from "@sekolahpro/api-client";
import { PerpDetailScaffold } from "../components/perpustakaan/PerpDetailScaffold";
import { perpFormatDate, perpFormatRupiah } from "../components/perpustakaan/perpFormatters";

const DOCTYPE = "Pengembalian Buku";

type Doc = {
  name: string;
  peminjaman?: string;
  anggota?: string;
  buku?: string;
  tanggal_kembali?: string;
  kondisi_kembali?: string;
  denda_total?: number;
  petugas?: string;
  catatan?: string;
};

const KONDISI_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Baik: "success",
  "Rusak Ringan": "warning",
  "Rusak Berat": "danger",
  Hilang: "danger",
};

function PengembalianDetailPage() {
  const { name } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useResourceDoc<Doc>(DOCTYPE, name);
  const doc = data;

  return (
    <PerpDetailScaffold
      eyebrow="Pengembalian Buku"
      title={name}
      backTo="/perpustakaan/pengembalian"
      crumbParent={{ label: "Pengembalian", to: "/perpustakaan/pengembalian" }}
      crumbSelf={name}
      description={doc?.peminjaman ? `Ref Peminjaman: ${doc.peminjaman}` : undefined}
      status={doc?.kondisi_kembali ? { label: doc.kondisi_kembali, tone: KONDISI_TONE[doc.kondisi_kembali] ?? "neutral" } : undefined}
      loading={isLoading}
      errorMessage={error ? (error as Error).message : undefined}
      primaryInfo={[
        { label: "No. Pengembalian", value: <span className="font-mono text-xs">{doc?.name ?? name}</span> },
        { label: "Ref Peminjaman", value: <span className="font-mono text-xs">{doc?.peminjaman ?? "—"}</span> },
        { label: "Anggota", value: doc?.anggota ?? "—" },
        { label: "Buku", value: doc?.buku ?? "—" },
        { label: "Tgl Kembali", value: perpFormatDate(doc?.tanggal_kembali) },
        { label: "Kondisi", value: doc?.kondisi_kembali ?? "—" },
        { label: "Denda Total", value: perpFormatRupiah(doc?.denda_total) },
        { label: "Petugas", value: doc?.petugas ?? "—" },
        { label: "Catatan", value: doc?.catatan ?? "—" },
      ]}
      actions={
        <Button size="sm" variant="outline" onClick={() => navigate({ to: "/perpustakaan/pengembalian" })}>Tutup</Button>
      }
    />
  );
}

export const Route = createFileRoute("/perpustakaan/pengembalian/$name")({ component: PengembalianDetailPage });
