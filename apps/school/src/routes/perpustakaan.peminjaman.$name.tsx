import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, FormField, Input, Modal } from "@sekolahpro/ui";
import { useResourceDoc, updateResource } from "@sekolahpro/api-client";
import { PerpDetailScaffold } from "../components/perpustakaan/PerpDetailScaffold";
import { perpFormatDate } from "../components/perpustakaan/perpFormatters";

const DOCTYPE = "Peminjaman Buku";

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

const STATUS_TONE: Record<string, "success" | "brand" | "warning" | "danger" | "neutral"> = {
  Aktif: "brand",
  Selesai: "success",
  Terlambat: "warning",
  Hilang: "danger",
  Batal: "neutral",
};

function PeminjamanDetailPage() {
  const { name } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, error } = useResourceDoc<Doc>(DOCTYPE, name);
  const [perpanjangOpen, setPerpanjangOpen] = useState(false);
  const [perpanjangDate, setPerpanjangDate] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["resource:doc", DOCTYPE, name] });
    qc.invalidateQueries({ queryKey: ["resource:list", DOCTYPE] });
  };

  const workflowMut = useMutation<Doc, Error, { patch: Record<string, unknown>; label: string }>({
    mutationFn: ({ patch }) => updateResource<Doc>(DOCTYPE, name, patch),
    onSuccess: () => invalidate(),
  });

  const handleKembalikan = () => {
    if (!confirm("Tandai peminjaman ini sebagai selesai (dikembalikan)?")) return;
    workflowMut.mutate({
      patch: { status: "Selesai", tanggal_kembali_aktual: new Date().toISOString().slice(0, 10) },
      label: "Kembalikan",
    });
  };

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

  return (
    <>
      <PerpDetailScaffold
        eyebrow="Peminjaman Buku"
        title={name}
        backTo="/perpustakaan/peminjaman"
        crumbParent={{ label: "Peminjaman", to: "/perpustakaan/peminjaman" }}
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
          { label: "Kembali Aktual", value: perpFormatDate(doc?.tanggal_kembali_aktual) },
          { label: "Petugas", value: doc?.petugas ?? "—" },
          { label: "Catatan", value: doc?.catatan ?? "—" },
        ]}
        actions={
          <>
            {status === "Aktif" || status === "Terlambat" ? (
              <>
                <Button size="sm" onClick={handleKembalikan} disabled={workflowMut.isPending}>Kembalikan</Button>
                <Button size="sm" variant="outline" onClick={() => setPerpanjangOpen(true)} disabled={workflowMut.isPending}>Perpanjang</Button>
                <Button size="sm" variant="destructive" onClick={handleBatalkan} disabled={workflowMut.isPending}>Batalkan</Button>
              </>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => navigate({ to: "/perpustakaan/peminjaman" })}>Tutup</Button>
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
    </>
  );
}

export const Route = createFileRoute("/perpustakaan/peminjaman/$name")({ component: PeminjamanDetailPage });
