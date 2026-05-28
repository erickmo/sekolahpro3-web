/**
 * Staff detail — live data from doctype "Guru".
 * Route param `nip` carries the Guru `name` (e.g. GURU-0001), not the actual NIP field.
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  DetailPageTemplate,
  EmptyState,
  InfoField,
  InfoGrid,
  PageHeader,
  SectionCard,
  Tabs,
  IconArrowLeft,
  IconCheck,
  IconHome,
  IconId,
  IconUsers,
  type TabItem,
} from "@sekolahpro/ui";
import { useResourceDoc, useResourceList } from "@sekolahpro/api-client";

type Guru = {
  name: string;
  nama_lengkap?: string;
  user?: string;
  foto?: string;
  nik?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  agama?: string;
  npwp?: string;
  no_hp?: string;
  email_pribadi?: string;
  alamat?: string;
  nuptk?: string;
  nip?: string;
  nrg?: string;
  status_kepegawaian?: string;
  sekolah?: string;
  is_aktif?: 0 | 1;
  tmt_cpns?: string;
  tmt_pertama_kerja?: string;
  tmt_di_sekolah?: string;
  pendidikan_terakhir?: string;
  golongan?: string;
  jabatan_fungsional?: string;
  sudah_sertifikasi?: 0 | 1;
  nomor_sertifikat?: string;
  bidang_studi?: string;
  tahun_sertifikasi?: number;
  bank?: string;
  no_rekening?: string;
  nuks?: string;
  nomor_karpeg?: string;
  nomor_taspen?: string;
  bpjs_kesehatan?: string;
  bpjs_ketenagakerjaan?: string;
};

type SkJabatanRow = {
  name: string;
  jenis_jabatan?: string;
  tanggal_sk?: string;
  tanggal_mulai_berlaku?: string;
  tanggal_berakhir?: string;
  status?: string;
};

type BerkasRow = {
  name: string;
  nama_berkas?: string;
  jenis_berkas?: string;
  tanggal_upload?: string;
  status_expire?: string;
};

type TabKey = "ringkasan" | "profil" | "kepegawaian" | "sk" | "berkas";

const VALID_TABS = new Set<TabKey>(["ringkasan", "profil", "kepegawaian", "sk", "berkas"]);

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

function StaffDetailPage() {
  const { nip } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const guruQ = useResourceDoc<Guru>("Guru", nip);
  const skQ = useResourceList<SkJabatanRow>("SK Jabatan", {
    fields: ["name", "jenis_jabatan", "tanggal_sk", "tanggal_mulai_berlaku", "tanggal_berakhir", "status"],
    filters: [["guru", "=", nip]],
    order_by: "tanggal_sk desc",
    limit_page_length: 50,
  });
  const berkasQ = useResourceList<BerkasRow>("Berkas Guru", {
    fields: ["name", "nama_berkas", "jenis_berkas", "tanggal_upload", "status_expire"],
    filters: [["guru", "=", nip]],
    order_by: "tanggal_upload desc",
    limit_page_length: 50,
  });

  const tab: TabKey = VALID_TABS.has(search.tab as TabKey) ? (search.tab as TabKey) : "ringkasan";
  const setTab = (next: TabKey) => {
    navigate({ to: "/staff/$nip", params: { nip }, search: { tab: next === "ringkasan" ? undefined : next } });
  };

  if (guruQ.isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-fg">Memuat data staff...</div>
    );
  }

  if (guruQ.isError || !guruQ.data) {
    return (
      <div className="py-16">
        <EmptyState
          title="Staff tidak ditemukan"
          description={guruQ.error ? (guruQ.error as Error).message : `Guru ${nip} tidak ada di sistem.`}
          action={
            <Link to="/staff/daftar" className="inline-flex items-center gap-2 text-sm text-brand hover:underline">
              <span className="h-4 w-4"><IconArrowLeft /></span> Kembali ke daftar
            </Link>
          }
        />
      </div>
    );
  }

  const g = guruQ.data;
  const skRows = skQ.data ?? [];
  const berkasRows = berkasQ.data ?? [];

  const tabItems: TabItem[] = [
    { key: "ringkasan", label: "Ringkasan", icon: <IconHome />, active: tab === "ringkasan",
      render: ({ className, children }) => <button type="button" onClick={() => setTab("ringkasan")} className={className}>{children}</button> },
    { key: "profil", label: "Profil", icon: <IconId />, active: tab === "profil",
      render: ({ className, children }) => <button type="button" onClick={() => setTab("profil")} className={className}>{children}</button> },
    { key: "kepegawaian", label: "Kepegawaian", icon: <IconUsers />, active: tab === "kepegawaian",
      render: ({ className, children }) => <button type="button" onClick={() => setTab("kepegawaian")} className={className}>{children}</button> },
    { key: "sk", label: "SK Jabatan", icon: <IconCheck />, count: skRows.length, active: tab === "sk",
      render: ({ className, children }) => <button type="button" onClick={() => setTab("sk")} className={className}>{children}</button> },
    { key: "berkas", label: "Berkas", icon: <IconId />, count: berkasRows.length, active: tab === "berkas",
      render: ({ className, children }) => <button type="button" onClick={() => setTab("berkas")} className={className}>{children}</button> },
  ];

  return (
    <DetailPageTemplate
      header={
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: "Dashboard", render: ({ className, children }) => <Link to="/" className={className}>{children}</Link> },
              { label: "Staff", render: ({ className, children }) => <Link to="/staff" className={className}>{children}</Link> },
              { label: g.nama_lengkap ?? g.name },
            ]}
          />
          <PageHeader
            eyebrow="Detail Staff"
            title={g.nama_lengkap ?? g.name}
            description={`${g.name}${g.nip ? ` · NIP ${g.nip}` : ""}${g.jabatan_fungsional ? ` · ${g.jabatan_fungsional}` : ""}`}
            actions={
              <Button variant="outline" onClick={() => navigate({ to: "/staff/daftar" })}>
                <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
                Kembali ke daftar
              </Button>
            }
          />
        </div>
      }
      hero={
        <div className="flex items-center gap-4">
          <Avatar name={g.nama_lengkap ?? g.name} size="lg" />
          <div className="flex flex-wrap gap-2">
            <Badge tone={g.is_aktif ? "success" : "neutral"} dot>
              {g.is_aktif ? "Aktif" : "Non-aktif"}
            </Badge>
            {g.status_kepegawaian && <Badge tone="neutral">{g.status_kepegawaian}</Badge>}
            {g.sudah_sertifikasi ? <Badge tone="brand">Tersertifikasi</Badge> : null}
            {g.sekolah && <Badge tone="neutral">{g.sekolah}</Badge>}
          </div>
        </div>
      }
      tabs={<Tabs items={tabItems} />}
      primary={
        tab === "ringkasan" ? <RingkasanTab g={g} /> :
        tab === "profil" ? <ProfilTab g={g} /> :
        tab === "kepegawaian" ? <KepegawaianTab g={g} /> :
        tab === "sk" ? <SkTab rows={skRows} loading={skQ.isLoading} /> :
        <BerkasTab rows={berkasRows} loading={berkasQ.isLoading} />
      }
    />
  );
}

function RingkasanTab({ g }: { g: Guru }) {
  return (
    <SectionCard title="Ringkasan">
      <InfoGrid>
        <InfoField label="Nama Lengkap" value={g.nama_lengkap ?? "—"} />
        <InfoField label="NIP" value={g.nip ?? "—"} />
        <InfoField label="NUPTK" value={g.nuptk ?? "—"} />
        <InfoField label="Status Kepegawaian" value={g.status_kepegawaian ?? "—"} />
        <InfoField label="Jabatan Fungsional" value={g.jabatan_fungsional ?? "—"} />
        <InfoField label="Sekolah" value={g.sekolah ?? "—"} />
        <InfoField label="TMT Pertama Kerja" value={formatDate(g.tmt_pertama_kerja)} />
        <InfoField label="TMT di Sekolah" value={formatDate(g.tmt_di_sekolah)} />
      </InfoGrid>
    </SectionCard>
  );
}

function ProfilTab({ g }: { g: Guru }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Identitas Pribadi">
        <InfoGrid>
          <InfoField label="NIK" value={g.nik ?? "—"} />
          <InfoField label="Tempat Lahir" value={g.tempat_lahir ?? "—"} />
          <InfoField label="Tanggal Lahir" value={formatDate(g.tanggal_lahir)} />
          <InfoField label="Jenis Kelamin" value={g.jenis_kelamin ?? "—"} />
          <InfoField label="Agama" value={g.agama ?? "—"} />
          <InfoField label="NPWP" value={g.npwp ?? "—"} />
        </InfoGrid>
      </SectionCard>
      <SectionCard title="Kontak">
        <InfoGrid>
          <InfoField label="User Login" value={g.user ?? "—"} />
          <InfoField label="Email Pribadi" value={g.email_pribadi ?? "—"} />
          <InfoField label="No HP" value={g.no_hp ?? "—"} />
          <InfoField label="Alamat" value={g.alamat ?? "—"} />
        </InfoGrid>
      </SectionCard>
    </div>
  );
}

function KepegawaianTab({ g }: { g: Guru }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Identitas Diknas">
        <InfoGrid>
          <InfoField label="NUPTK" value={g.nuptk ?? "—"} />
          <InfoField label="NIP" value={g.nip ?? "—"} />
          <InfoField label="NRG" value={g.nrg ?? "—"} />
          <InfoField label="Pendidikan Terakhir" value={g.pendidikan_terakhir ?? "—"} />
          <InfoField label="Golongan" value={g.golongan ?? "—"} />
          <InfoField label="Jabatan Fungsional" value={g.jabatan_fungsional ?? "—"} />
        </InfoGrid>
      </SectionCard>
      <SectionCard title="Tanggal Mulai Tugas">
        <InfoGrid>
          <InfoField label="TMT CPNS" value={formatDate(g.tmt_cpns)} />
          <InfoField label="TMT Pertama Kerja" value={formatDate(g.tmt_pertama_kerja)} />
          <InfoField label="TMT di Sekolah" value={formatDate(g.tmt_di_sekolah)} />
        </InfoGrid>
      </SectionCard>
      <SectionCard title="Sertifikasi">
        <InfoGrid>
          <InfoField label="Sudah Sertifikasi" value={g.sudah_sertifikasi ? "Ya" : "Belum"} />
          <InfoField label="Nomor Sertifikat" value={g.nomor_sertifikat ?? "—"} />
          <InfoField label="Bidang Studi" value={g.bidang_studi ?? "—"} />
          <InfoField label="Tahun Sertifikasi" value={g.tahun_sertifikasi ? String(g.tahun_sertifikasi) : "—"} />
        </InfoGrid>
      </SectionCard>
      <SectionCard title="Kartu Identitas & Keuangan">
        <InfoGrid>
          <InfoField label="Bank" value={g.bank ?? "—"} />
          <InfoField label="No Rekening" value={g.no_rekening ?? "—"} />
          <InfoField label="No Karpeg" value={g.nomor_karpeg ?? "—"} />
          <InfoField label="No Taspen" value={g.nomor_taspen ?? "—"} />
          <InfoField label="BPJS Kesehatan" value={g.bpjs_kesehatan ?? "—"} />
          <InfoField label="BPJS Ketenagakerjaan" value={g.bpjs_ketenagakerjaan ?? "—"} />
        </InfoGrid>
      </SectionCard>
    </div>
  );
}

function SkTab({ rows, loading }: { rows: SkJabatanRow[]; loading: boolean }) {
  return (
    <SectionCard
      title="SK Jabatan"
      description={loading ? "Memuat..." : `${rows.length} SK`}
      action={
        <Link to="/staff/sk-jabatan">
          <Button variant="outline" size="sm">Kelola SK</Button>
        </Link>
      }
    >
      {rows.length === 0 ? (
        <div className="text-sm text-muted-fg">Belum ada SK Jabatan.</div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.name} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-fg truncate">{r.jenis_jabatan ?? r.name}</div>
                <div className="text-xs text-muted-fg">
                  SK {formatDate(r.tanggal_sk)} · Berlaku {formatDate(r.tanggal_mulai_berlaku)}
                  {r.tanggal_berakhir ? ` – ${formatDate(r.tanggal_berakhir)}` : ""}
                </div>
              </div>
              <Badge tone={r.status === "Diterbitkan" ? "success" : r.status === "Dicabut" ? "neutral" : "warning"} dot>
                {r.status ?? "—"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function BerkasTab({ rows, loading }: { rows: BerkasRow[]; loading: boolean }) {
  return (
    <SectionCard
      title="Berkas"
      description={loading ? "Memuat..." : `${rows.length} berkas`}
      action={
        <Link to="/staff/berkas">
          <Button variant="outline" size="sm">Kelola Berkas</Button>
        </Link>
      }
    >
      {rows.length === 0 ? (
        <div className="text-sm text-muted-fg">Belum ada berkas.</div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.name} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-fg truncate">{r.nama_berkas ?? r.name}</div>
                <div className="text-xs text-muted-fg">
                  {r.jenis_berkas ?? "—"} · Diunggah {formatDate(r.tanggal_upload)}
                </div>
              </div>
              <Badge tone={r.status_expire === "Aktif" ? "success" : r.status_expire === "Expired" ? "danger" : "neutral"} dot>
                {r.status_expire ?? "—"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

type SearchParams = { tab?: TabKey | undefined };

export const Route = createFileRoute("/staff/$nip")({
  component: StaffDetailPage,
  validateSearch: (raw: Record<string, unknown>): SearchParams => {
    const t = typeof raw.tab === "string" ? raw.tab : undefined;
    return { tab: t && VALID_TABS.has(t as TabKey) ? (t as TabKey) : undefined };
  },
});
