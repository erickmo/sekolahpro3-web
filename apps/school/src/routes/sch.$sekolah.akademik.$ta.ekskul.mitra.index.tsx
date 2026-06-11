/**
 * Mitra Ekstrakurikuler — kelola kerja sama pihak ketiga (MOU).
 *
 * Halaman ini mencatat lembaga/individu/komunitas yang menjalankan program
 * ekstrakurikuler atas dasar perjanjian kerja sama (MOU). Mitra yang tercatat
 * di sini lalu dipilih sebagai "penyelenggara Mitra" saat membuat program.
 *
 * Framing peran (tidak pernah menyembunyikan fitur): koordinator mendata mitra
 * dan MOU; kepala sekolah yang menyetujui kerja sama dengan pihak ketiga.
 *
 * Mematuhi exactOptionalPropertyTypes + noUncheckedIndexedAccess: field opsional
 * yang kosong DIHILANGKAN dari payload (bukan dikirim sebagai string kosong),
 * dan akses indeks selalu dijaga dengan `?.`/`?? fallback`.
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createResource, useResourceList } from "@sekolahpro/api-client";
import { useSession } from "@sekolahpro/auth";
import {
  PageHeader,
  SectionCard,
  StatCard,
  Button,
  Modal,
  Badge,
  Input,
  Select,
  Textarea,
  IconPlus,
  IconUsers,
  IconCheck,
  IconFlag,
} from "@sekolahpro/ui";
import { PageGuide, type PageGuideStep } from "../components/guide";
import { useEkskulRole, ROLE_LABEL } from "../lib/ekskulRole";

const DOCTYPE = "Mitra Ekstrakurikuler";

/** Field yang diambil saat melisting mitra. */
const MITRA_FIELDS = [
  "name",
  "nama_mitra",
  "jenis",
  "bidang",
  "status",
  "kontak_nama",
  "kontak_telepon",
  "tanggal_mulai_mou",
  "tanggal_akhir_mou",
  "nomor_mou",
];

/** Pilihan jenis mitra (sesuai Select doctype). */
const JENIS_OPTIONS = ["Lembaga", "Individu", "Komunitas"] as const;
/** Pilihan status MOU (sesuai Select doctype). */
const STATUS_OPTIONS = ["Aktif", "Berakhir", "Ditangguhkan"] as const;
const DEFAULT_STATUS: (typeof STATUS_OPTIONS)[number] = "Aktif";

/** Tanggal hari ini dalam format ISO (YYYY-MM-DD) untuk perbandingan MOU. */
const TODAY_ISO = new Date().toISOString().slice(0, 10);

const GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Catat mitra dan MOU di sini",
    detail:
      'Tambahkan lembaga, individu, atau komunitas beserta nomor & periode MOU lewat tombol "Mitra Baru".',
    roles: ["koordinator"],
  },
  {
    title: "Pilih mitra saat membuat program",
    detail:
      'Di menu Program, set penyelenggara ke "Mitra" lalu pilih mitra ini sebagai pelaksana kegiatan.',
    roles: ["koordinator"],
  },
  {
    title: "Tinjau & setujui kerja sama",
    detail:
      "Kepala sekolah menyetujui kerja sama dengan pihak ketiga dan memantau MOU yang akan/berakhir.",
    roles: ["kepala"],
  },
];

/** Baris mitra hasil listing. */
interface MitraRow {
  name: string;
  nama_mitra?: string;
  jenis?: string;
  bidang?: string;
  status?: string;
  kontak_nama?: string;
  kontak_telepon?: string;
  tanggal_mulai_mou?: string;
  tanggal_akhir_mou?: string;
  nomor_mou?: string;
}

/** State form pembuatan mitra (semua string agar input terkontrol). */
interface MitraForm {
  nama_mitra: string;
  jenis: string;
  bidang: string;
  kontak_nama: string;
  kontak_telepon: string;
  email: string;
  alamat: string;
  nomor_mou: string;
  tanggal_mulai_mou: string;
  tanggal_akhir_mou: string;
  status: string;
  catatan: string;
}

const INITIAL_FORM: MitraForm = {
  nama_mitra: "",
  jenis: JENIS_OPTIONS[0],
  bidang: "",
  kontak_nama: "",
  kontak_telepon: "",
  email: "",
  alamat: "",
  nomor_mou: "",
  tanggal_mulai_mou: "",
  tanggal_akhir_mou: "",
  status: DEFAULT_STATUS,
  catatan: "",
};

/** True bila MOU sudah berakhir per hari ini (tanggal akhir terisi & < hari ini). */
function isMouExpired(row: Pick<MitraRow, "tanggal_akhir_mou">): boolean {
  const end = row.tanggal_akhir_mou;
  return !!end && end < TODAY_ISO;
}

/** Tone Badge untuk status mitra. */
function statusTone(status: string | undefined): "success" | "neutral" | "warning" {
  if (status === "Aktif") return "success";
  if (status === "Ditangguhkan") return "warning";
  return "neutral";
}

/** Susun payload create: hanya field bisnis terisi (omit string kosong). */
function buildPayload(form: MitraForm, sekolah: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    nama_mitra: form.nama_mitra.trim(),
    jenis: form.jenis,
    status: form.status,
    sekolah,
  };
  const optional: Array<[keyof MitraForm, string]> = [
    ["bidang", "bidang"],
    ["kontak_nama", "kontak_nama"],
    ["kontak_telepon", "kontak_telepon"],
    ["email", "email"],
    ["alamat", "alamat"],
    ["nomor_mou", "nomor_mou"],
    ["tanggal_mulai_mou", "tanggal_mulai_mou"],
    ["tanggal_akhir_mou", "tanggal_akhir_mou"],
    ["catatan", "catatan"],
  ];
  for (const [key, field] of optional) {
    const value = form[key].trim();
    if (value) payload[field] = value;
  }
  return payload;
}

/** Baris label/value ringkas untuk detail kartu mitra. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="shrink-0 text-muted-fg">{label}</span>
      <span className="min-w-0 truncate text-fg">{value}</span>
    </div>
  );
}

/** Kartu satu mitra: identitas, kontak, dan periode MOU. */
function MitraCard({ row }: { row: MitraRow }) {
  const expired = isMouExpired(row);
  const periode =
    row.tanggal_mulai_mou || row.tanggal_akhir_mou
      ? `${row.tanggal_mulai_mou ?? "?"} s/d ${row.tanggal_akhir_mou ?? "?"}`
      : "Belum ada periode MOU";
  return (
    <div className="rounded-lg border border-border bg-bg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-fg">
            {row.nama_mitra ?? row.name}
          </h3>
          {row.bidang ? <p className="text-xs text-muted-fg">{row.bidang}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          <Badge tone="brand">{row.jenis ?? "Mitra"}</Badge>
          <Badge tone={statusTone(row.status)}>{row.status ?? "—"}</Badge>
          {expired ? (
            <Badge tone="warning" dot>
              MOU berakhir
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="space-y-1 border-t border-border pt-2">
        <DetailRow label="Kontak" value={row.kontak_nama ?? "—"} />
        <DetailRow label="Telepon" value={row.kontak_telepon ?? "—"} />
        <DetailRow label="No. MOU" value={row.nomor_mou ?? "—"} />
        <DetailRow label="Periode" value={periode} />
      </div>
    </div>
  );
}

/** Field bertanda label + kontrol form, dengan penanda wajib opsional. */
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-fg">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

/** Modal form pembuatan mitra baru beserta validasi tanggal MOU. */
function MitraFormModal({
  open,
  onClose,
  sekolah,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  sekolah: string | undefined;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<MitraForm>(INITIAL_FORM);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof MitraForm>(key: K, value: string) =>
    setForm((cur) => ({ ...cur, [key]: value }));

  const dateError =
    !!form.tanggal_mulai_mou &&
    !!form.tanggal_akhir_mou &&
    form.tanggal_akhir_mou < form.tanggal_mulai_mou
      ? "Tanggal akhir MOU harus sama atau setelah tanggal mulai."
      : null;

  const canSubmit = !!form.nama_mitra.trim() && !!sekolah && !dateError && !saving;

  const close = () => {
    setForm(INITIAL_FORM);
    setErr(null);
    onClose();
  };

  /** Kirim payload ke server; tutup + reset + refetch saat sukses. */
  const submit = async () => {
    setErr(null);
    if (!sekolah) {
      setErr("Sekolah aktif tidak ditemukan.");
      return;
    }
    if (dateError) return;
    setSaving(true);
    try {
      await createResource(DOCTYPE, buildPayload(form, sekolah));
      setForm(INITIAL_FORM);
      onCreated();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal menyimpan mitra.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Mitra Baru"
      description="Catat lembaga/individu/komunitas beserta MOU. Tanda * wajib diisi."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close}>
            Batal
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nama Mitra" required>
          <Input
            value={form.nama_mitra}
            onChange={(e) => set("nama_mitra", e.target.value)}
            placeholder="Sanggar Seni Nusantara"
          />
        </Field>
        <Field label="Jenis">
          <Select value={form.jenis} onChange={(e) => set("jenis", e.target.value)}>
            {JENIS_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Bidang">
          <Input
            value={form.bidang}
            onChange={(e) => set("bidang", e.target.value)}
            placeholder="Tari & Musik"
          />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nama Kontak">
          <Input
            value={form.kontak_nama}
            onChange={(e) => set("kontak_nama", e.target.value)}
            placeholder="Budi Santoso"
          />
        </Field>
        <Field label="Telepon Kontak">
          <Input
            value={form.kontak_telepon}
            onChange={(e) => set("kontak_telepon", e.target.value)}
            placeholder="08123456789"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="kontak@mitra.id"
          />
        </Field>
        <Field label="Nomor MOU">
          <Input
            value={form.nomor_mou}
            onChange={(e) => set("nomor_mou", e.target.value)}
            placeholder="MOU/2026/001"
          />
        </Field>
        <Field label="Tanggal Mulai MOU">
          <Input
            type="date"
            value={form.tanggal_mulai_mou}
            onChange={(e) => set("tanggal_mulai_mou", e.target.value)}
          />
        </Field>
        <Field label="Tanggal Akhir MOU">
          <Input
            type="date"
            value={form.tanggal_akhir_mou}
            onChange={(e) => set("tanggal_akhir_mou", e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Alamat">
            <Textarea
              value={form.alamat}
              onChange={(e) => set("alamat", e.target.value)}
              placeholder="Alamat lengkap mitra"
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Catatan">
            <Textarea
              value={form.catatan}
              onChange={(e) => set("catatan", e.target.value)}
              placeholder="Catatan tambahan tentang kerja sama"
            />
          </Field>
        </div>
      </div>

      {dateError ? (
        <p className="mt-3 text-xs text-danger">{dateError}</p>
      ) : null}
      {err ? (
        <div className="mt-3 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {err}
        </div>
      ) : null}
    </Modal>
  );
}

/** Halaman daftar mitra ekstrakurikuler + aksi pembuatan mitra baru. */
function MitraPage() {
  const session = useSession();
  const sekolah = session.activeSekolah?.name;
  const { primary } = useEkskulRole();
  const [modalOpen, setModalOpen] = useState(false);

  const mitraQ = useResourceList<MitraRow>(DOCTYPE, {
    fields: MITRA_FIELDS,
    order_by: "`nama_mitra` asc",
    limit_page_length: 0,
  });
  const mitra = useMemo(() => mitraQ.data ?? [], [mitraQ.data]);

  const stats = useMemo(() => {
    const aktif = mitra.filter((m) => m.status === "Aktif").length;
    const expired = mitra.filter((m) => isMouExpired(m)).length;
    return { total: mitra.length, aktif, expired };
  }, [mitra]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ekstrakurikuler"
        title="Mitra & Kerja Sama"
        description="Kelola mitra pihak ketiga beserta MOU yang menjalankan program ekstrakurikuler."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <IconPlus className="h-4 w-4 shrink-0" />
            Mitra Baru
          </Button>
        }
      />

      <PageGuide
        storageId="ekskul-mitra"
        title="Cara mengelola mitra"
        intro='Catat mitra & MOU di sini, lalu pilih "Mitra" sebagai penyelenggara saat membuat program.'
        steps={GUIDE_STEPS}
        roleLabels={ROLE_LABEL}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Mitra"
          value={mitraQ.isLoading ? "…" : stats.total}
          hint="Tercatat di sekolah ini"
          icon={<IconUsers />}
          accent="brand"
        />
        <StatCard
          label="Mitra Aktif"
          value={mitraQ.isLoading ? "…" : stats.aktif}
          hint="Status Aktif"
          icon={<IconCheck />}
          accent="emerald"
        />
        <StatCard
          label="MOU Berakhir"
          value={mitraQ.isLoading ? "…" : stats.expired}
          hint="Perlu diperbarui"
          icon={<IconFlag />}
          accent="amber"
        />
      </div>

      <SectionCard
        title="Daftar Mitra"
        description={`Peran Anda: ${ROLE_LABEL[primary]}. Kepala sekolah menyetujui kerja sama dengan pihak ketiga.`}
      >
        {mitraQ.isLoading ? (
          <p className="text-sm text-muted-fg">Memuat mitra…</p>
        ) : mitra.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-fg">
              Belum ada mitra. Tambahkan mitra pertama untuk mulai mencatat kerja sama.
            </p>
            <Button className="mt-3" onClick={() => setModalOpen(true)}>
              <IconPlus className="h-4 w-4 shrink-0" />
              Mitra Baru
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {mitra.map((row) => (
              <MitraCard key={row.name} row={row} />
            ))}
          </div>
        )}
      </SectionCard>

      <MitraFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sekolah={sekolah}
        onCreated={() => mitraQ.refetch()}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/ekskul/mitra/")({
  component: MitraPage,
});
