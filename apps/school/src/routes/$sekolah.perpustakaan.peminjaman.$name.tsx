/**
 * Detail Peminjaman Buku — pusat sirkulasi single-doc.
 *
 * Per PERP-ADR-0001 (merge sirkulasi perpustakaan):
 * - Action "Kembalikan" wajib lewat doctype Pengembalian Buku (insert + submit)
 *   agar hook on_submit jalan: release eksemplar, auto-generate denda, update
 *   status peminjaman. Patch langsung `status=Selesai` (perilaku lama) dilarang.
 * - Denda dilihat & dilunasi inline lewat DendaDrawer.
 */
import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, FormField, Input, Modal } from "@sekolahpro/ui";
import { useResourceDoc, useResourceList, updateResource } from "@sekolahpro/api-client";
import { PerpDetailScaffold } from "../components/perpustakaan/PerpDetailScaffold";
import { perpFormatDate } from "../components/perpustakaan/perpFormatters";
import { ReturnModal } from "../components/perpustakaan/ReturnModal";
import { DendaDrawer } from "../components/perpustakaan/DendaDrawer";

const DOCTYPE = "Peminjaman Buku";
const DOCTYPE_PENGEMBALIAN = "Pengembalian Buku";

type Doc = {
  name: string;
  anggota?: string;
  buku?: string;
  kopi?: string;
  tanggal_pinjam?: string;
  tanggal_rencana_kembali?: string;
  tanggal_kembali_aktual?: string;
  status?: string;
  petugas?: string;
  catatan?: string;
};

type PengembalianRow = {
  name: string;
  tanggal_kembali_aktual?: string;
  catatan?: string;
};

const STATUS_TONE: Record<string, "success" | "brand" | "warning" | "danger" | "neutral"> = {
  Aktif: "brand",
  Selesai: "success",
  Terlambat: "warning",
  Hilang: "danger",
  Batal: "neutral",
};

function PeminjamanDetailPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const { name } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, error } = useResourceDoc<Doc>(DOCTYPE, name);

  // Pengembalian terkait — ditampilkan inline (rute pengembalian/$name dihapus).
  const { data: returnDocs = [] } = useResourceList<PengembalianRow>(DOCTYPE_PENGEMBALIAN, {
    filters: [["peminjaman", "=", name]],
    fields: ["name", "tanggal_kembali_aktual", "catatan"],
    limit_page_length: 5,
  });
  const pengembalian = returnDocs[0];

  const [perpanjangOpen, setPerpanjangOpen] = useState(false);
  const [perpanjangDate, setPerpanjangDate] = useState("");
  const [returnOpen, setReturnOpen] = useState(false);
  const [dendaOpen, setDendaOpen] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["resource:doc", DOCTYPE, name] });
    qc.invalidateQueries({ queryKey: ["resource:list", DOCTYPE] });
  };

  const workflowMut = useMutation<Doc, Error, { patch: Record<string, unknown>; label: string }>({
    mutationFn: ({ patch }) => updateResource<Doc>(DOCTYPE, name, patch),
    onSuccess: () => invalidate(),
  });

  const handleBatalkan = () => {
    if (!confirm("Batalkan peminjaman ini?")) return;
    workflowMut.mutate({ patch: { status: "Batal" }, label: "Batalkan" });
  };

  const handlePerpanjangSubmit = () => {
    if (!perpanjangDate) {
      alert("Tanggal rencana kembali baru wajib diisi.");
      return;
    }
    workflowMut.mutate({
      patch: { tanggal_rencana_kembali: perpanjangDate },
      label: "Perpanjang",
    });
    setPerpanjangOpen(false);
    setPerpanjangDate("");
  };

  const doc = data;
  const status = doc?.status;
  const isActive = status === "Aktif" || status === "Terlambat";

  return (
    <>
      <PerpDetailScaffold
        eyebrow="Peminjaman Buku"
        title={name}
        backTo="/$sekolah/perpustakaan/peminjaman"
        crumbParent={{ label: "Peminjaman", to: "/$sekolah/perpustakaan/peminjaman" }}
        crumbSelf={name}
        description={doc?.anggota ? `Peminjam: ${doc.anggota}` : undefined}
        status={status ? { label: status, tone: STATUS_TONE[status] ?? "neutral" } : undefined}
        loading={isLoading}
        errorMessage={error ? (error as Error).message : undefined}
        primaryInfo={[
          { label: "No. Peminjaman", value: <span className="font-mono text-xs">{doc?.name ?? name}</span> },
          { label: "Anggota", value: doc?.anggota ?? "—" },
          { label: "Buku", value: doc?.buku ?? "—" },
          { label: "Kopi", value: doc?.kopi ?? "—" },
          { label: "Tgl Pinjam", value: perpFormatDate(doc?.tanggal_pinjam) },
          { label: "Rencana Kembali", value: perpFormatDate(doc?.tanggal_rencana_kembali) },
          { label: "Kembali Aktual", value: perpFormatDate(pengembalian?.tanggal_kembali_aktual ?? doc?.tanggal_kembali_aktual) },
          { label: "No. Pengembalian", value: pengembalian ? <span className="font-mono text-xs">{pengembalian.name}</span> : "—" },
          { label: "Petugas", value: doc?.petugas ?? "—" },
          { label: "Catatan", value: doc?.catatan ?? "—" },
        ]}
        actions={
          <>
            {isActive ? (
              <>
                <Button size="sm" onClick={() => setReturnOpen(true)} disabled={workflowMut.isPending}>Kembalikan</Button>
                <Button size="sm" variant="outline" onClick={() => setPerpanjangOpen(true)} disabled={workflowMut.isPending}>Perpanjang</Button>
                <Button size="sm" variant="destructive" onClick={handleBatalkan} disabled={workflowMut.isPending}>Batalkan</Button>
              </>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => setDendaOpen(true)}>Lihat Denda</Button>
            <Button size="sm" variant="outline" onClick={() => navigate({ to: "/$sekolah/perpustakaan/peminjaman", params: { sekolah } })}>Tutup</Button>
          </>
        }
      />
      <Modal
        open={perpanjangOpen}
        onClose={() => setPerpanjangOpen(false)}
        title="Perpanjang Peminjaman"
        description="Tentukan tanggal rencana kembali yang baru."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPerpanjangOpen(false)}>Batal</Button>
            <Button onClick={handlePerpanjangSubmit} disabled={workflowMut.isPending}>Simpan</Button>
          </>
        }
      >
        <FormField label="Tanggal Rencana Kembali Baru" required htmlFor="perpanjang-date">
          <Input id="perpanjang-date" type="date" value={perpanjangDate} onChange={(e) => setPerpanjangDate(e.target.value)} />
        </FormField>
      </Modal>
      {returnOpen && (
        <ReturnModal
          open
          peminjaman={name}
          onClose={() => setReturnOpen(false)}
          onSuccess={() => {
            setReturnOpen(false);
            invalidate();
          }}
        />
      )}
      {dendaOpen && (
        <DendaDrawer open peminjaman={name} onClose={() => setDendaOpen(false)} />
      )}
    </>
  );
}

export const Route = createFileRoute("/$sekolah/perpustakaan/peminjaman/$name")({ component: PeminjamanDetailPage });
