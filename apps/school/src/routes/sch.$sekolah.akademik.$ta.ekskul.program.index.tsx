import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  useResourceList,
  listResource,
  createResource,
} from "@sekolahpro/api-client";
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
  SearchableSelect,
  cn,
  IconPlus,
  IconFlag,
  IconCheck,
  type SearchableOption,
} from "@sekolahpro/ui";
import { PageGuide, type PageGuideStep } from "../components/guide";
import { useEkskulContext } from "../lib/ekskulContext";
import { useEkskulRole, ROLE_LABEL } from "../lib/ekskulRole";
import { programStats } from "../lib/ekskulRecap";

/** One catalog program row read from the Ekstrakurikuler doctype. */
interface ProgramRow {
  name: string;
  nama?: string | undefined;
  kategori?: string | undefined;
  status?: string | undefined;
  penyelenggara?: string | undefined;
  kuota?: number | undefined;
  pembina?: string | undefined;
  mitra?: string | undefined;
  hari?: string | undefined;
}

/** Fields fetched for the program list (mirrors backend Ekstrakurikuler). */
const PROGRAM_FIELDS = [
  "name",
  "nama",
  "kategori",
  "status",
  "penyelenggara",
  "kuota",
  "pembina",
  "mitra",
  "hari",
] as const;

const KATEGORI_OPTIONS = [
  "Olahraga",
  "Seni Budaya",
  "Akademik & Sains",
  "Keagamaan",
  "Bela Diri",
  "Kepramukaan",
  "Teknologi",
  "Lainnya",
] as const;

const HARI_OPTIONS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;

const PENYELENGGARA_INTERNAL = "Internal";
const PENYELENGGARA_MITRA = "Mitra";
const STATUS_AKTIF = "Aktif";
const STATUS_NONAKTIF = "Nonaktif";
const DOCTYPE = "Ekstrakurikuler";
const PICKER_PAGE = 50;
const TIME_SECONDS_SUFFIX = ":00";

const GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Susun katalog program",
    detail:
      'Klik "Program Baru": isi nama, kategori, dan tentukan apakah dijalankan Internal (pembina sekolah) atau Mitra.',
    roles: ["koordinator"],
  },
  {
    title: "Tetapkan pembina atau mitra",
    detail:
      "Program internal yang Aktif wajib punya pembina; program mitra wajib menunjuk mitra terdaftar yang berstatus Aktif.",
    roles: ["koordinator"],
  },
  {
    title: "Atur jadwal dan kuota",
    detail:
      "Lengkapi hari, jam, dan ruangan agar peserta tahu kapan kegiatan berlangsung. Kuota 0 berarti tanpa batas.",
    roles: ["koordinator"],
  },
];

/** Editable draft for the create-program form. */
interface ProgramForm {
  nama: string;
  kategori: string;
  penyelenggara: string;
  pembina: string;
  mitra: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  ruangan: string;
  kuota: string;
  status: string;
  deskripsi: string;
}

/** Blank form draft used on first open and after a successful create. */
const EMPTY_FORM: ProgramForm = {
  nama: "",
  kategori: KATEGORI_OPTIONS[0],
  penyelenggara: PENYELENGGARA_INTERNAL,
  pembina: "",
  mitra: "",
  hari: "",
  jamMulai: "",
  jamSelesai: "",
  ruangan: "",
  kuota: "0",
  status: STATUS_AKTIF,
  deskripsi: "",
};

/** Append ":00" so an "HH:MM" time input becomes the "HH:MM:SS" backend wants. */
function toBackendTime(hhmm: string): string {
  return `${hhmm}${TIME_SECONDS_SUFFIX}`;
}

/**
 * Client-side guard mirroring the backend rules. Returns an Indonesian error
 * message, or null when the draft is safe to submit.
 */
function validateForm(f: ProgramForm): string | null {
  if (!f.nama.trim()) return "Nama program wajib diisi.";
  if (f.penyelenggara === PENYELENGGARA_MITRA && !f.mitra) {
    return "Program mitra wajib menunjuk satu mitra terdaftar.";
  }
  if (f.penyelenggara === PENYELENGGARA_INTERNAL && f.status === STATUS_AKTIF && !f.pembina) {
    return "Program internal yang aktif wajib memiliki pembina.";
  }
  if (f.jamMulai && f.jamSelesai && f.jamSelesai <= f.jamMulai) {
    return "Jam selesai harus lebih dari jam mulai.";
  }
  return null;
}

/**
 * Build the create payload from a validated draft. Empty optional Link/Data
 * fields are omitted entirely (never sent as "") to satisfy
 * exactOptionalPropertyTypes and Frappe Link validation.
 */
function buildPayload(f: ProgramForm, tahunAjaran: string, sekolah: string): Record<string, unknown> {
  const internal = f.penyelenggara === PENYELENGGARA_INTERNAL;
  return {
    nama: f.nama.trim(),
    kategori: f.kategori,
    penyelenggara: f.penyelenggara,
    tahun_ajaran: tahunAjaran,
    sekolah,
    status: f.status,
    kuota: Number(f.kuota) || 0,
    ...(internal && f.pembina ? { pembina: f.pembina } : {}),
    ...(!internal && f.mitra ? { mitra: f.mitra } : {}),
    ...(f.hari ? { hari: f.hari } : {}),
    ...(f.jamMulai ? { jam_mulai: toBackendTime(f.jamMulai) } : {}),
    ...(f.jamSelesai ? { jam_selesai: toBackendTime(f.jamSelesai) } : {}),
    ...(f.ruangan ? { ruangan: f.ruangan } : {}),
    ...(f.deskripsi.trim() ? { deskripsi: f.deskripsi.trim() } : {}),
  };
}

/** Map a doctype row {name, label} into a SearchableSelect option. */
function toOption(name: string, label: string | undefined): SearchableOption {
  return { value: name, label: label ?? name };
}

/** Async loader: search Pegawai by nama_lengkap for the pembina picker. */
async function loadPegawai(q: string): Promise<SearchableOption[]> {
  const filters: [string, string, string][] = q ? [["nama_lengkap", "like", `%${q}%`]] : [];
  const rows = await listResource<{ name: string; nama_lengkap?: string }>("Pegawai", {
    fields: ["name", "nama_lengkap"],
    filters,
    order_by: "`nama_lengkap` asc",
    limit_page_length: PICKER_PAGE,
  });
  return rows.map((r) => toOption(r.name, r.nama_lengkap));
}

/** Async loader: search active Mitra Ekstrakurikuler for the mitra picker. */
async function loadMitra(q: string): Promise<SearchableOption[]> {
  const filters: [string, string, string][] = [["status", "=", STATUS_AKTIF]];
  if (q) filters.push(["nama_mitra", "like", `%${q}%`]);
  const rows = await listResource<{ name: string; nama_mitra?: string }>("Mitra Ekstrakurikuler", {
    fields: ["name", "nama_mitra"],
    filters,
    order_by: "`nama_mitra` asc",
    limit_page_length: PICKER_PAGE,
  });
  return rows.map((r) => toOption(r.name, r.nama_mitra));
}

/** Async loader: search Ruangan by nama for the optional room picker. */
async function loadRuangan(q: string): Promise<SearchableOption[]> {
  const filters: [string, string, string][] = q ? [["nama", "like", `%${q}%`]] : [];
  const rows = await listResource<{ name: string; nama?: string }>("Ruangan", {
    fields: ["name", "nama"],
    filters,
    order_by: "`nama` asc",
    limit_page_length: PICKER_PAGE,
  });
  return rows.map((r) => toOption(r.name, r.nama));
}

/** Small labelled wrapper so each form control gets a consistent caption. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-fg">{label}</span>
      {children}
    </label>
  );
}

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  tahunAjaran: string;
  sekolah: string;
  onCreated: () => void;
}

/** Modal create form for one catalog program. Owns its own draft state. */
function ProgramFormModal({ open, onClose, tahunAjaran, sekolah, onCreated }: FormModalProps) {
  const [form, setForm] = useState<ProgramForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = useCallback(
    <K extends keyof ProgramForm>(key: K, value: ProgramForm[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const close = useCallback(() => {
    setForm(EMPTY_FORM);
    setError(null);
    onClose();
  }, [onClose]);

  const submit = useCallback(async () => {
    const message = validateForm(form);
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createResource(DOCTYPE, buildPayload(form, tahunAjaran, sekolah));
      setForm(EMPTY_FORM);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan program.");
    } finally {
      setSaving(false);
    }
  }, [form, tahunAjaran, sekolah, onCreated, onClose]);

  const internal = form.penyelenggara === PENYELENGGARA_INTERNAL;

  return (
    <Modal
      open={open}
      onClose={close}
      title="Program Baru"
      description="Tambahkan satu kegiatan ke katalog tahun ajaran berjalan."
      icon={<IconPlus />}
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Batal
          </Button>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error ? (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}

        <Field label="Nama Program">
          <Input
            value={form.nama}
            onChange={(e) => set("nama", e.target.value)}
            placeholder="mis. Futsal Putra"
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Kategori">
            <Select value={form.kategori} onChange={(e) => set("kategori", e.target.value)}>
              {KATEGORI_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Penyelenggara">
            <Select
              value={form.penyelenggara}
              onChange={(e) => set("penyelenggara", e.target.value)}
            >
              <option value={PENYELENGGARA_INTERNAL}>Internal</option>
              <option value={PENYELENGGARA_MITRA}>Mitra</option>
            </Select>
          </Field>
        </div>

        {internal ? (
          <Field label="Pembina">
            <SearchableSelect
              value={form.pembina}
              onChange={(v) => set("pembina", v)}
              loadOptions={loadPegawai}
              placeholder="Cari pegawai…"
            />
          </Field>
        ) : (
          <Field label="Mitra">
            <SearchableSelect
              value={form.mitra}
              onChange={(v) => set("mitra", v)}
              loadOptions={loadMitra}
              placeholder="Cari mitra aktif…"
            />
          </Field>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Hari">
            <Select value={form.hari} onChange={(e) => set("hari", e.target.value)}>
              <option value="">— Pilih hari —</option>
              {HARI_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Jam Mulai">
            <Input
              type="time"
              value={form.jamMulai}
              onChange={(e) => set("jamMulai", e.target.value)}
            />
          </Field>
          <Field label="Jam Selesai">
            <Input
              type="time"
              value={form.jamSelesai}
              onChange={(e) => set("jamSelesai", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Ruangan (opsional)">
            <SearchableSelect
              value={form.ruangan}
              onChange={(v) => set("ruangan", v)}
              loadOptions={loadRuangan}
              placeholder="Cari ruangan…"
            />
          </Field>
          <Field label="Kuota (0 = tanpa batas)">
            <Input
              type="number"
              min={0}
              value={form.kuota}
              onChange={(e) => set("kuota", e.target.value)}
            />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value={STATUS_AKTIF}>Aktif</option>
              <option value={STATUS_NONAKTIF}>Nonaktif</option>
            </Select>
          </Field>
        </div>

        <Field label="Deskripsi (opsional)">
          <Textarea
            value={form.deskripsi}
            onChange={(e) => set("deskripsi", e.target.value)}
            placeholder="Tujuan singkat atau catatan kegiatan…"
          />
        </Field>
      </div>
    </Modal>
  );
}

/** Human label for a program's kuota: "tanpa batas" when 0/empty. */
function kuotaLabel(kuota: number | undefined): string {
  return kuota && kuota > 0 ? `Kuota: ${kuota}` : "Kuota: tanpa batas";
}

/** One program rendered as a card row in the catalog list. */
function ProgramRowItem({ row }: { row: ProgramRow }) {
  const aktif = row.status === STATUS_AKTIF;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-border bg-bg px-4 py-3">
      <span className="font-medium text-fg">{row.nama ?? row.name}</span>
      {row.kategori ? <Badge tone="neutral">{row.kategori}</Badge> : null}
      <Badge tone={aktif ? "success" : "neutral"} dot>
        {aktif ? "Aktif" : "Nonaktif"}
      </Badge>
      <Badge tone="brand">{row.penyelenggara ?? PENYELENGGARA_INTERNAL}</Badge>
      <span className="text-xs text-muted-fg">{kuotaLabel(row.kuota)}</span>
      {row.hari ? <span className="text-xs text-muted-fg">{row.hari}</span> : null}
    </div>
  );
}

/** Empty-state block with a primary CTA to create the first program. */
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <SectionCard
      title="Belum ada program"
      description="Katalog tahun ajaran ini masih kosong. Mulai dengan satu kegiatan."
    >
      <Button onClick={onCreate}>
        <IconPlus className="mr-1.5 h-4 w-4 shrink-0" />
        Program Baru
      </Button>
    </SectionCard>
  );
}

/** Koordinator-facing catalog manager for Ekstrakurikuler programs. */
function ProgramCatalog() {
  const ctx = useEkskulContext();
  const { primary } = useEkskulRole();
  const activeSekolah = useSession().activeSekolah?.name ?? "";
  const [modalOpen, setModalOpen] = useState(false);

  const filters = useMemo<[string, string, string][]>(
    () => (ctx.tahunAjaran ? [["tahun_ajaran", "=", ctx.tahunAjaran]] : []),
    [ctx.tahunAjaran],
  );

  const listQ = useResourceList<ProgramRow>(
    DOCTYPE,
    {
      fields: [...PROGRAM_FIELDS],
      filters,
      order_by: "`nama` asc",
      limit_page_length: 0,
    },
    { enabled: !!ctx.tahunAjaran },
  );
  const rows = useMemo(() => listQ.data ?? [], [listQ.data]);
  const stats = useMemo(() => programStats(rows), [rows]);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ekstrakurikuler › Program"
        title="Katalog Program"
        description="Kelola daftar kegiatan ekstrakurikuler: pembina, mitra, jadwal, dan kuota."
        actions={
          <Button onClick={openModal} disabled={!ctx.tahunAjaran || !activeSekolah}>
            <IconPlus className="mr-1.5 h-4 w-4 shrink-0" />
            Program Baru
          </Button>
        }
      />

      <PageGuide
        storageId="ekskul-program"
        title="Cara mengelola katalog"
        intro={`Anda masuk sebagai ${ROLE_LABEL[primary]}. Susun program agar pembina tinggal menjalankan.`}
        steps={GUIDE_STEPS}
        roleLabels={ROLE_LABEL}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Total Program"
          value={listQ.isLoading ? "…" : stats.total}
          hint="Pada tahun ajaran terpilih"
          icon={<IconFlag />}
          accent="brand"
        />
        <StatCard
          label="Program Aktif"
          value={listQ.isLoading ? "…" : stats.aktif}
          hint={`${stats.nonaktif} nonaktif`}
          icon={<IconCheck />}
          accent="emerald"
        />
      </div>

      {rows.length === 0 && !listQ.isLoading ? (
        <EmptyState onCreate={openModal} />
      ) : (
        <SectionCard title="Daftar Program" description="Urut menurut nama.">
          <div className={cn("space-y-2", listQ.isLoading && "opacity-60")}>
            {rows.map((row) => (
              <ProgramRowItem key={row.name} row={row} />
            ))}
          </div>
        </SectionCard>
      )}

      <ProgramFormModal
        open={modalOpen}
        onClose={closeModal}
        tahunAjaran={ctx.tahunAjaran}
        sekolah={activeSekolah}
        onCreated={() => listQ.refetch()}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/ekskul/program/")({
  component: ProgramCatalog,
});
