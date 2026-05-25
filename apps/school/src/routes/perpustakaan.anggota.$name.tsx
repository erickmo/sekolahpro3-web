import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@sekolahpro/ui";
import { useResourceDoc, updateResource } from "@sekolahpro/api-client";
import { PerpDetailScaffold } from "../components/perpustakaan/PerpDetailScaffold";
import { perpFormatRupiah } from "../components/perpustakaan/perpFormatters";

const DOCTYPE = "Anggota Perpustakaan";

type Doc = {
  name: string;
  nama_lengkap?: string;
  tipe_anggota?: string;
  nis_nip?: string;
  kelas?: string;
  status?: string;
  saldo_denda?: number;
  email?: string;
  no_hp?: string;
  tanggal_daftar?: string;
  catatan?: string;
};

const STATUS_TONE: Record<string, "success" | "warning" | "neutral" | "brand" | "danger"> = {
  Aktif: "success",
  Dibekukan: "warning",
  Lulus: "neutral",
  Keluar: "neutral",
};

function AnggotaDetailPage() {
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

  const handleBekukan = () => {
    if (!confirm("Bekukan keanggotaan ini? Anggota tidak dapat meminjam.")) return;
    workflowMut.mutate({ status: "Dibekukan" });
  };
  const handleAktifkan = () => {
    if (!confirm("Aktifkan kembali keanggotaan ini?")) return;
    workflowMut.mutate({ status: "Aktif" });
  };

  return (
    <PerpDetailScaffold
      eyebrow="Anggota Perpustakaan"
      title={doc?.nama_lengkap ?? name}
      backTo="/perpustakaan/anggota"
      crumbParent={{ label: "Anggota", to: "/perpustakaan/anggota" }}
      crumbSelf={doc?.nama_lengkap ?? name}
      description={doc?.tipe_anggota ? `${doc.tipe_anggota}${doc.kelas ? ` · ${doc.kelas}` : ""}` : undefined}
      status={status ? { label: status, tone: STATUS_TONE[status] ?? "neutral" } : undefined}
      loading={isLoading}
      errorMessage={error ? (error as Error).message : undefined}
      primaryInfo={[
        { label: "ID Anggota", value: <span className="font-mono text-xs">{doc?.name ?? name}</span> },
        { label: "Nama Lengkap", value: doc?.nama_lengkap ?? "—" },
        { label: "Tipe", value: doc?.tipe_anggota ?? "—" },
        { label: "NIS/NIP", value: doc?.nis_nip ?? "—" },
        { label: "Kelas", value: doc?.kelas ?? "—" },
        { label: "Email", value: doc?.email ?? "—" },
        { label: "No HP", value: doc?.no_hp ?? "—" },
        { label: "Tgl Daftar", value: doc?.tanggal_daftar ?? "—" },
        { label: "Saldo Denda", value: <span className="tabular-nums">{perpFormatRupiah(doc?.saldo_denda)}</span> },
      ]}
      secondaryInfo={doc?.catatan ? [{ label: "Catatan", value: doc.catatan }] : undefined}
      actions={
        <>
          {status === "Aktif" ? (
            <Button size="sm" variant="destructive" onClick={handleBekukan} disabled={workflowMut.isPending}>Bekukan</Button>
          ) : null}
          {status === "Dibekukan" ? (
            <Button size="sm" onClick={handleAktifkan} disabled={workflowMut.isPending}>Aktifkan</Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => navigate({ to: "/perpustakaan/anggota" })}>Tutup</Button>
        </>
      }
    />
  );
}

export const Route = createFileRoute("/perpustakaan/anggota/$name")({ component: AnggotaDetailPage });
