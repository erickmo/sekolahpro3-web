/**
 * Calon Siswa — list + form CRUD lengkap untuk biodata pendaftar.
 *
 * Source of truth (fields): doctype Calon Siswa di backend Frappe.
 */

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  Modal,
  PageHeader,
  Pagination,
  SectionCard,
  IconPlus,
  type Column,
} from "@sekolahpro/ui";
import { useResourceList, useResourceCreate } from "@sekolahpro/api-client";

type Row = {
  name: string;
  nama_lengkap?: string;
  nisn?: string;
  nik?: string;
  jenis_kelamin?: string;
  asal_sekolah?: string;
  no_hp?: string;
  siswa?: string;
};

const PAGE_SIZE = 25;

function CalonSiswaPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const params = useMemo(() => {
    const filters: Array<[string, string, unknown]> = [];
    if (search.trim()) {
      filters.push(["nama_lengkap", "like", `%${search.trim()}%`]);
    }
    return {
      fields: ["name", "nama_lengkap", "nisn", "nik", "jenis_kelamin", "asal_sekolah", "no_hp", "siswa"],
      ...(filters.length ? { filters } : {}),
      order_by: "`nama_lengkap` asc",
      limit_start: (page - 1) * PAGE_SIZE,
      limit_page_length: PAGE_SIZE + 1,
    };
  }, [search, page]);

  const q = useResourceList<Row>("Calon Siswa", params);
  const fetched = q.data ?? [];
  const hasNext = fetched.length > PAGE_SIZE;
  const rows = hasNext ? fetched.slice(0, PAGE_SIZE) : fetched;

  const COLUMNS: Column<Row>[] = [
    { key: "name", header: "ID", cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
    {
      key: "nama_lengkap",
      header: "Nama Lengkap",
      cell: (r) => <span className="font-medium">{r.nama_lengkap ?? "—"}</span>,
    },
    { key: "nisn", header: "NISN", cell: (r) => <span className="font-mono text-xs">{r.nisn ?? "—"}</span> },
    { key: "jenis_kelamin", header: "JK", cell: (r) => r.jenis_kelamin ?? "—" },
    { key: "asal_sekolah", header: "Asal Sekolah", cell: (r) => r.asal_sekolah ?? "—" },
    { key: "no_hp", header: "No HP", cell: (r) => r.no_hp ?? "—" },
    {
      key: "siswa",
      header: "Status",
      cell: (r) =>
        r.siswa ? (
          <Badge tone="success" dot>
            Sudah jadi Siswa
          </Badge>
        ) : (
          <Badge tone="neutral" dot>
            Calon
          </Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PPDB"
        title="Calon Siswa"
        description="Biodata pendaftar — sumber data Siswa setelah finalisasi."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
            Tambah Calon
          </Button>
        }
      />

      <SectionCard padded={false}>
        <div className="p-3">
          <FilterBar
            search={{
              value: search,
              onChange: (v) => {
                setSearch(v);
                setPage(1);
              },
              placeholder: "Cari nama lengkap...",
            }}
          />
        </div>

        <DataTable
          data={rows}
          columns={COLUMNS}
          rowKey={(r) => r.name}
          empty={q.isLoading ? "Memuat..." : q.isError ? "Gagal memuat." : "Belum ada calon siswa."}
        />

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={(page - 1) * PAGE_SIZE + rows.length + (hasNext ? 1 : 0)}
          onPageChange={setPage}
        />
      </SectionCard>

      <CalonCreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => q.refetch()} />
    </div>
  );
}

function CalonCreateModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const create = useResourceCreate("Calon Siswa");

  const set = (k: string, v: string) => setForm((cur) => ({ ...cur, [k]: v }));

  const reset = () => {
    setForm({});
    setErr(null);
  };

  const submit = async () => {
    setErr(null);
    try {
      await create.mutateAsync({
        nama_lengkap: form.nama_lengkap,
        nama_panggilan: form.nama_panggilan || undefined,
        jenis_kelamin: form.jenis_kelamin || undefined,
        tempat_lahir: form.tempat_lahir || undefined,
        tanggal_lahir: form.tanggal_lahir || undefined,
        agama: form.agama || undefined,
        kewarganegaraan: form.kewarganegaraan || "WNI",
        nik: form.nik || undefined,
        nisn: form.nisn || undefined,
        asal_sekolah: form.asal_sekolah || undefined,
        tahun_lulus_asal: form.tahun_lulus_asal || undefined,
        alamat: form.alamat || undefined,
        no_hp: form.no_hp || undefined,
        email: form.email || undefined,
        nama_wali: form.nama_wali || undefined,
        hubungan_wali: form.hubungan_wali || undefined,
        no_hp_wali: form.no_hp_wali || undefined,
        pekerjaan_wali: form.pekerjaan_wali || undefined,
        penghasilan_wali: form.penghasilan_wali || undefined,
      });
      reset();
      onCreated();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat calon siswa.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      size="xl"
      title="Tambah Calon Siswa"
      description="Isi biodata pendaftar. Tanda * wajib."
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Batal</Button>
          <Button onClick={submit} disabled={!form.nama_lengkap || create.isPending}>
            {create.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-fg">Identitas</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nama Lengkap *"><Input value={form.nama_lengkap} onChange={(v) => set("nama_lengkap", v)} /></Field>
            <Field label="Nama Panggilan"><Input value={form.nama_panggilan} onChange={(v) => set("nama_panggilan", v)} /></Field>
            <Field label="Jenis Kelamin">
              <Select value={form.jenis_kelamin} onChange={(v) => set("jenis_kelamin", v)} options={["", "Laki-laki", "Perempuan"]} />
            </Field>
            <Field label="Tempat Lahir"><Input value={form.tempat_lahir} onChange={(v) => set("tempat_lahir", v)} /></Field>
            <Field label="Tanggal Lahir"><Input type="date" value={form.tanggal_lahir} onChange={(v) => set("tanggal_lahir", v)} /></Field>
            <Field label="Agama">
              <Select value={form.agama} onChange={(v) => set("agama", v)} options={["", "Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"]} />
            </Field>
            <Field label="NIK"><Input value={form.nik} onChange={(v) => set("nik", v)} /></Field>
            <Field label="NISN"><Input value={form.nisn} onChange={(v) => set("nisn", v)} /></Field>
            <Field label="Kewarganegaraan"><Input value={form.kewarganegaraan} onChange={(v) => set("kewarganegaraan", v)} placeholder="WNI" /></Field>
          </div>
        </section>
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-fg">Sekolah Asal</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Asal Sekolah"><Input value={form.asal_sekolah} onChange={(v) => set("asal_sekolah", v)} /></Field>
            <Field label="Tahun Lulus Asal"><Input value={form.tahun_lulus_asal} onChange={(v) => set("tahun_lulus_asal", v)} /></Field>
          </div>
        </section>
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-fg">Kontak</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="No HP"><Input value={form.no_hp} onChange={(v) => set("no_hp", v)} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(v) => set("email", v)} /></Field>
            <Field label="Alamat" cols={2}><Input value={form.alamat} onChange={(v) => set("alamat", v)} /></Field>
          </div>
        </section>
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-fg">Wali / Orangtua</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nama Wali"><Input value={form.nama_wali} onChange={(v) => set("nama_wali", v)} /></Field>
            <Field label="Hubungan">
              <Select value={form.hubungan_wali} onChange={(v) => set("hubungan_wali", v)} options={["", "Ayah", "Ibu", "Wali"]} />
            </Field>
            <Field label="No HP Wali"><Input value={form.no_hp_wali} onChange={(v) => set("no_hp_wali", v)} /></Field>
            <Field label="Pekerjaan"><Input value={form.pekerjaan_wali} onChange={(v) => set("pekerjaan_wali", v)} /></Field>
            <Field label="Penghasilan"><Input value={form.penghasilan_wali} onChange={(v) => set("penghasilan_wali", v)} /></Field>
          </div>
        </section>
        {err && (
          <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {err}
          </div>
        )}
      </div>
    </Modal>
  );
}

const inputCls =
  "h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus:border-brand focus:outline-none";

function Field({ label, children, cols = 1 }: { label: string; children: React.ReactNode; cols?: 1 | 2 }) {
  return (
    <label className={`block ${cols === 2 ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-medium text-muted-fg">{label}</span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string | undefined;
}) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o || "— pilih —"}
        </option>
      ))}
    </select>
  );
}

export const Route = createFileRoute("/$sekolah/ppdb/calon-siswa")({ component: CalonSiswaPage });
