import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useFrappeMutation, useResourceDoc } from "@sekolahpro/api-client";
import {
  Badge,
  Button,
  InfoField,
  InfoGrid,
  PageHeader,
  SectionCard,
} from "@sekolahpro/ui";

interface PendaftaranDoc {
  name: string;
  nama_lengkap: string;
  nisn?: string;
  nik?: string;
  jenis_kelamin: string;
  tempat_lahir?: string;
  tanggal_lahir: string;
  asal_sekolah?: string;
  jenis_pendaftaran: string;
  tanggal_daftar: string;
  rombel_target?: string;
  telepon_wali?: string;
  email_wali?: string;
  catatan?: string;
  siswa_dibuat?: string;
  status: "Draft" | "Submitted" | "Diterima" | "Ditolak";
}

const STATUS_TONE: Record<PendaftaranDoc["status"], "neutral" | "warning" | "success" | "danger"> = {
  Draft: "neutral",
  Submitted: "warning",
  Diterima: "success",
  Ditolak: "danger",
};

function PendaftaranDetailPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const { id } = useParams({ from: "/sch/$sekolah/siswa/pendaftaran/$id" });
  const qc = useQueryClient();
  const docQuery = useResourceDoc<PendaftaranDoc>("Pendaftaran Siswa", id);

  const submitDoc = useFrappeMutation<{ doctype: string; name: string }>(
    "frappe.client.submit",
  );
  const acceptDoc = useFrappeMutation<{ name: string }>(
    "sekolahpro.siswa.pendaftaran_siswa.terima_pendaftaran",
  );
  const rejectDoc = useFrappeMutation<{ name: string; reason: string }>(
    "sekolahpro.siswa.pendaftaran_siswa.tolak_pendaftaran",
  );

  if (docQuery.isLoading) return <div className="p-6 text-sm text-muted-fg">Memuat pendaftaran…</div>;
  if (docQuery.isError || !docQuery.data) {
    return (
      <div className="p-6">
        <Badge tone="danger">
          Gagal memuat: {(docQuery.error as Error)?.message ?? "tidak ditemukan"}
        </Badge>
        <div className="mt-4">
          <Link to="/sch/$sekolah/siswa/pendaftaran" params={{ sekolah }} className="text-brand hover:underline">
            ← Kembali ke daftar
          </Link>
        </div>
      </div>
    );
  }

  const doc = docQuery.data;
  const status = doc.status;

  async function action(fn: () => Promise<unknown>) {
    await fn();
    qc.invalidateQueries({ queryKey: ["resource:doc", "Pendaftaran Siswa", doc.name] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-fg">
        <Link to="/sch/$sekolah/siswa/pendaftaran" params={{ sekolah }} className="text-brand hover:underline">
          ← Siswa › Pendaftaran
        </Link>
        <span>›</span>
        <span className="font-mono">{doc.name}</span>
      </div>

      <PageHeader
        eyebrow="Pendaftaran Siswa"
        title={doc.nama_lengkap}
        description={`${doc.jenis_pendaftaran} · ${doc.tanggal_daftar}`}
        actions={
          <Badge tone={STATUS_TONE[status]} dot>
            {status}
          </Badge>
        }
      />

      <SectionCard
        title="Identitas"
        action={
          status === "Draft" ? (
            <Button
              size="sm"
              onClick={() =>
                void action(() =>
                  submitDoc.mutateAsync({ doctype: "Pendaftaran Siswa", name: doc.name }),
                )
              }
              disabled={submitDoc.isPending}
            >
              Submit Pendaftaran
            </Button>
          ) : null
        }
      >
        <InfoGrid cols={3}>
          <InfoField label="Nama Lengkap" value={doc.nama_lengkap} />
          <InfoField label="Jenis Kelamin" value={doc.jenis_kelamin} />
          <InfoField
            label="Tempat, Tanggal Lahir"
            value={`${doc.tempat_lahir ?? "—"}, ${doc.tanggal_lahir}`}
          />
          {doc.nisn ? <InfoField label="NISN" value={<span className="font-mono">{doc.nisn}</span>} /> : null}
          {doc.nik ? <InfoField label="NIK" value={<span className="font-mono">{doc.nik}</span>} /> : null}
          {doc.asal_sekolah ? <InfoField label="Asal Sekolah" value={doc.asal_sekolah} /> : null}
        </InfoGrid>
      </SectionCard>

      <SectionCard title="Pendaftaran">
        <InfoGrid cols={3}>
          <InfoField label="Jenis" value={<Badge tone="brand">{doc.jenis_pendaftaran}</Badge>} />
          <InfoField label="Tanggal Daftar" value={doc.tanggal_daftar} />
          {doc.rombel_target ? <InfoField label="Rombel Target" value={doc.rombel_target} /> : null}
        </InfoGrid>
        {doc.catatan ? (
          <div className="mt-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-fg">Catatan</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-fg/90">{doc.catatan}</p>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Kontak Wali">
        <InfoGrid cols={2}>
          {doc.telepon_wali ? <InfoField label="Telepon" value={doc.telepon_wali} /> : null}
          {doc.email_wali ? <InfoField label="Email" value={doc.email_wali} /> : null}
        </InfoGrid>
      </SectionCard>

      {status === "Submitted" ? (
        <SectionCard title="Keputusan" action={<Badge tone="warning" dot>Menunggu</Badge>}>
          <p className="mb-3 text-xs text-muted-fg">
            Menerima pendaftaran akan otomatis membuat record Siswa + Anggota Rombel sesuai
            rombel target dan menerbitkan event <code>siswa.ppdb.diterima</code>.
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                const reason = window.prompt("Alasan penolakan?");
                if (!reason || reason.trim().length < 10) {
                  alert("Alasan minimal 10 karakter.");
                  return;
                }
                void action(() => rejectDoc.mutateAsync({ name: doc.name, reason: reason.trim() }));
              }}
              disabled={rejectDoc.isPending || acceptDoc.isPending}
            >
              Tolak
            </Button>
            <Button
              onClick={() => void action(() => acceptDoc.mutateAsync({ name: doc.name }))}
              disabled={rejectDoc.isPending || acceptDoc.isPending}
            >
              {acceptDoc.isPending ? "Memproses…" : "Terima Pendaftaran"}
            </Button>
          </div>
        </SectionCard>
      ) : null}

      {doc.siswa_dibuat ? (
        <SectionCard title="Siswa Terkait">
          <div className="flex items-center gap-3">
            <Badge tone="success" dot>
              Siswa Aktif
            </Badge>
            <Link
              to="/sch/$sekolah/siswa/$nis"
              params={{ sekolah, nis: doc.siswa_dibuat }}
              className="font-mono text-sm text-brand hover:underline"
            >
              {doc.siswa_dibuat}
            </Link>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/pendaftaran/$id")({ component: PendaftaranDetailPage });
