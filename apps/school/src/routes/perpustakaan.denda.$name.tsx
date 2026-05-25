import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, FormField, Modal, Select } from "@sekolahpro/ui";
import { useResourceDoc, updateResource, useFrappeMutation } from "@sekolahpro/api-client";
import { PerpDetailScaffold } from "../components/perpustakaan/PerpDetailScaffold";
import { perpFormatDate, perpFormatRupiah } from "../components/perpustakaan/perpFormatters";

const DOCTYPE = "Denda Perpustakaan";
const METHOD_LUNASKAN_KOPERASI = "perpustakaan.api.lunaskan_denda_koperasi";

type Doc = {
  name: string;
  anggota?: string;
  peminjaman?: string;
  jenis?: string;
  nominal?: number;
  status?: string;
  tanggal_diterbitkan?: string;
  tanggal_lunas?: string;
  metode_pembayaran?: string;
  catatan?: string;
};

const STATUS_TONE: Record<string, "success" | "warning" | "neutral" | "brand" | "danger"> = {
  Lunas: "success",
  "Belum Lunas": "warning",
  Diputihkan: "neutral",
};

function DendaDetailPage() {
  const { name } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, error } = useResourceDoc<Doc>(DOCTYPE, name);
  const doc = data;
  const status = doc?.status;

  const [lunaskanOpen, setLunaskanOpen] = useState(false);
  const [metode, setMetode] = useState<string>("Tunai");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["resource:doc", DOCTYPE, name] });
    qc.invalidateQueries({ queryKey: ["resource:list", DOCTYPE] });
  };

  const lunaskanTunaiMut = useMutation<Doc, Error, void>({
    mutationFn: () => updateResource<Doc>(DOCTYPE, name, {
      status: "Lunas",
      metode_pembayaran: "Tunai",
      tanggal_lunas: new Date().toISOString().slice(0, 10),
    }),
    onSuccess: () => invalidate(),
  });

  const lunaskanKoperasiMut = useFrappeMutation<{ denda: string }, unknown>(METHOD_LUNASKAN_KOPERASI);

  const submitLunaskan = () => {
    setLunaskanOpen(false);
    if (metode === "Koperasi") {
      lunaskanKoperasiMut.mutate({ denda: name }, { onSuccess: () => invalidate() });
    } else {
      lunaskanTunaiMut.mutate();
    }
  };

  const busy = lunaskanTunaiMut.isPending || lunaskanKoperasiMut.isPending;

  return (
    <>
      <PerpDetailScaffold
        eyebrow="Denda Perpustakaan"
        title={name}
        backTo="/perpustakaan/denda"
        crumbParent={{ label: "Denda", to: "/perpustakaan/denda" }}
        crumbSelf={name}
        description={doc?.anggota ? `Anggota: ${doc.anggota}` : undefined}
        status={status ? { label: status, tone: STATUS_TONE[status] ?? "neutral" } : undefined}
        loading={isLoading}
        errorMessage={error ? (error as Error).message : undefined}
        primaryInfo={[
          { label: "No. Denda", value: <span className="font-mono text-xs">{doc?.name ?? name}</span> },
          { label: "Anggota", value: doc?.anggota ?? "—" },
          { label: "Ref Peminjaman", value: doc?.peminjaman ? <span className="font-mono text-xs">{doc.peminjaman}</span> : "—" },
          { label: "Jenis", value: doc?.jenis ?? "—" },
          { label: "Nominal", value: <span className="tabular-nums">{perpFormatRupiah(doc?.nominal)}</span> },
          { label: "Tgl Terbit", value: perpFormatDate(doc?.tanggal_diterbitkan) },
          { label: "Tgl Lunas", value: perpFormatDate(doc?.tanggal_lunas) },
          { label: "Metode Bayar", value: doc?.metode_pembayaran ?? "—" },
          { label: "Catatan", value: doc?.catatan ?? "—" },
        ]}
        actions={
          <>
            {status === "Belum Lunas" ? (
              <Button size="sm" onClick={() => setLunaskanOpen(true)} disabled={busy}>Lunaskan</Button>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => navigate({ to: "/perpustakaan/denda" })}>Tutup</Button>
          </>
        }
      />
      <Modal
        open={lunaskanOpen}
        onClose={() => setLunaskanOpen(false)}
        title="Lunaskan Denda"
        description="Pilih metode pelunasan."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setLunaskanOpen(false)}>Batal</Button>
            <Button onClick={submitLunaskan} disabled={busy}>Konfirmasi</Button>
          </>
        }
      >
        <FormField label="Metode Pembayaran" htmlFor="metode-bayar" required>
          <Select id="metode-bayar" value={metode} onChange={(e) => setMetode(e.target.value)}>
            <option value="Tunai">Tunai</option>
            <option value="Koperasi">Potong Saldo Koperasi</option>
          </Select>
        </FormField>
      </Modal>
    </>
  );
}

export const Route = createFileRoute("/perpustakaan/denda/$name")({ component: DendaDetailPage });
