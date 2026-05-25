import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@sekolahpro/ui";
import { useResourceDoc, updateResource } from "@sekolahpro/api-client";
import { PerpDetailScaffold } from "../components/perpustakaan/PerpDetailScaffold";
import { perpFormatDate } from "../components/perpustakaan/perpFormatters";

const DOCTYPE = "Reservasi Buku";

type Doc = {
  name: string;
  buku?: string;
  anggota?: string;
  posisi_antrian?: number;
  status?: string;
  tanggal_reservasi?: string;
  berlaku_sampai?: string;
  catatan?: string;
};

const STATUS_TONE: Record<string, "success" | "brand" | "warning" | "danger" | "neutral"> = {
  Aktif: "brand",
  Dipenuhi: "success",
  Kedaluwarsa: "warning",
  Batal: "neutral",
};

function ReservasiDetailPage() {
  const { name } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, error } = useResourceDoc<Doc>(DOCTYPE, name);
  const doc = data;
  const status = doc?.status;

  const workflowMut = useMutation<Doc, Error, Record<string, unknown>>({
    mutationFn: (patch) => updateResource<Doc>(DOCTYPE, name, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resource:doc", DOCTYPE, name] });
      qc.invalidateQueries({ queryKey: ["resource:list", DOCTYPE] });
    },
  });

  const handlePenuhi = () => {
    if (!confirm("Tandai reservasi ini sebagai dipenuhi?")) return;
    workflowMut.mutate({ status: "Dipenuhi" });
  };
  const handleBatal = () => {
    if (!confirm("Batalkan reservasi ini?")) return;
    workflowMut.mutate({ status: "Batal" });
  };

  return (
    <PerpDetailScaffold
      eyebrow="Reservasi Buku"
      title={name}
      backTo="/perpustakaan/reservasi"
      crumbParent={{ label: "Reservasi", to: "/perpustakaan/reservasi" }}
      crumbSelf={name}
      description={doc?.buku ? `Buku: ${doc.buku}` : undefined}
      status={status ? { label: status, tone: STATUS_TONE[status] ?? "neutral" } : undefined}
      loading={isLoading}
      errorMessage={error ? (error as Error).message : undefined}
      primaryInfo={[
        { label: "No. Reservasi", value: <span className="font-mono text-xs">{doc?.name ?? name}</span> },
        { label: "Buku", value: doc?.buku ?? "—" },
        { label: "Anggota", value: doc?.anggota ?? "—" },
        { label: "Posisi Antrian", value: doc?.posisi_antrian !== undefined ? `#${doc.posisi_antrian}` : "—" },
        { label: "Tgl Reservasi", value: perpFormatDate(doc?.tanggal_reservasi) },
        { label: "Berlaku Sampai", value: perpFormatDate(doc?.berlaku_sampai) },
        { label: "Catatan", value: doc?.catatan ?? "—" },
      ]}
      actions={
        <>
          {status === "Aktif" ? (
            <>
              <Button size="sm" onClick={handlePenuhi} disabled={workflowMut.isPending}>Penuhi</Button>
              <Button size="sm" variant="destructive" onClick={handleBatal} disabled={workflowMut.isPending}>Batal</Button>
            </>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => navigate({ to: "/perpustakaan/reservasi" })}>Tutup</Button>
        </>
      }
    />
  );
}

export const Route = createFileRoute("/perpustakaan/reservasi/$name")({ component: ReservasiDetailPage });
