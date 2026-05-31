import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, Button, SectionCard } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { MasterDetailPage, StatusBadge } from "../components/master/MasterDetailPage";
import { MasterCreateModal, type MasterFieldDef } from "../components/master/MasterCreateModal";
import { TAHUN_AJARAN_FIELDS, SEMESTER_FIELDS } from "../components/master/schemas";
import { CreateResourceModal, type FieldSpec } from "../components/akademik/CreateResourceModal";

type Doc = { name: string; nama: string; tanggal_mulai?: string; tanggal_selesai?: string; status?: string };
type Semester = {
  name: string;
  nama: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  status?: string;
};

const SEMESTER_FIELDS_LIST = ["name", "nama", "tanggal_mulai", "tanggal_selesai", "status"];

function fmtDate(s?: string): string {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? s
    : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// Semester list scoped to one tahun ajaran, rendered inside the TA detail page.
function SemesterSection({ tahunAjaran }: { tahunAjaran: string }) {
  const [open, setOpen] = useState(false);
  const q = useResourceList<Semester>("Semester", {
    fields: SEMESTER_FIELDS_LIST,
    filters: [["tahun_ajaran", "=", tahunAjaran]],
    order_by: "`tanggal_mulai` asc",
    limit_page_length: 50,
  });
  const rows = q.data ?? [];

  // Prefill + lock the parent tahun_ajaran field for new semesters.
  const semesterFields = useMemo<MasterFieldDef[]>(
    () =>
      SEMESTER_FIELDS.map((f) =>
        f.name === "tahun_ajaran"
          ? { ...f, defaultValue: tahunAjaran, disabledOnEdit: true }
          : f,
      ),
    [tahunAjaran],
  );

  return (
    <SectionCard
      title="Semester"
      description="Semester dalam tahun ajaran ini."
      action={
        <Button size="sm" onClick={() => setOpen(true)}>
          Tambah Semester
        </Button>
      }
    >
      {q.isLoading ? (
        <div className="space-y-2 animate-pulse" aria-hidden>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-muted" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-muted-fg">Belum ada semester pada tahun ajaran ini.</div>
      ) : (
        <ul className="divide-y divide-border -my-2">
          {rows.map((s) => (
            <li key={s.name} className="py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-fg truncate">{s.nama || s.name}</div>
                <div className="text-xs text-muted-fg">
                  {fmtDate(s.tanggal_mulai)} – {fmtDate(s.tanggal_selesai)}
                </div>
              </div>
              <Badge tone={s.status === "Aktif" ? "success" : "neutral"} dot>
                {s.status ?? "—"}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <MasterCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Semester"
        title="Tambah Semester"
        fields={semesterFields}
        onSaved={() => void q.refetch()}
      />
    </SectionCard>
  );
}

// ── KKM section ──────────────────────────────────────────────────────────────

type KkmRow = {
  name: string;
  mata_pelajaran: string;
  tingkat?: string;
  tipe_kkm?: string;
  nilai_kkm?: number | null;
};

const TINGKAT_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const v = String(i + 1);
  return { value: v, label: `Tingkat ${v}` };
});

const TIPE_KKM_OPTIONS = [
  { value: "Angka", label: "Angka" },
  { value: "Interval", label: "Interval" },
  { value: "Deskriptif", label: "Deskriptif" },
];

function KkmSection({ tahunAjaran }: { tahunAjaran: string }) {
  const [open, setOpen] = useState(false);
  const q = useResourceList<KkmRow>("KKM", {
    fields: ["name", "mata_pelajaran", "tingkat", "tipe_kkm", "nilai_kkm"],
    filters: [["tahun_ajaran", "=", tahunAjaran]],
    order_by: "`mata_pelajaran` asc",
    limit_page_length: 100,
  });
  const rows = q.data ?? [];

  const fields = useMemo<FieldSpec[]>(
    () => [
      {
        name: "mata_pelajaran",
        label: "Mata Pelajaran",
        kind: "link",
        required: true,
        linkDoctype: "Mata Pelajaran",
        linkLabelField: "nama_mapel",
        linkHintField: "kode_mapel",
      },
      {
        name: "tingkat",
        label: "Tingkat",
        kind: "select",
        required: true,
        options: TINGKAT_OPTIONS,
      },
      {
        name: "tipe_kkm",
        label: "Tipe KKM",
        kind: "select",
        required: true,
        defaultValue: "Angka",
        options: TIPE_KKM_OPTIONS,
      },
      {
        name: "nilai_kkm",
        label: "Nilai KKM (0–100)",
        kind: "number",
        required: true,
        showWhen: { field: "tipe_kkm", equals: "Angka" },
        validate: (v) => {
          const n = typeof v === "number" ? v : Number(v);
          if (Number.isNaN(n)) return "Harus angka";
          if (n < 0 || n > 100) return "Rentang 0–100";
          return null;
        },
      },
    ],
    [],
  );

  return (
    <SectionCard
      title="KKM"
      description="Kriteria Ketuntasan Minimal per mapel pada tahun ajaran ini."
      action={
        <Button size="sm" onClick={() => setOpen(true)}>
          Tambah KKM
        </Button>
      }
    >
      {q.isLoading ? (
        <div className="space-y-2 animate-pulse" aria-hidden>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-muted" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-muted-fg">Belum ada KKM untuk tahun ajaran ini.</div>
      ) : (
        <ul className="divide-y divide-border -my-2">
          {rows.map((r) => (
            <li key={r.name} className="py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-fg truncate">{r.mata_pelajaran}</div>
                <div className="text-xs text-muted-fg">
                  Tingkat {r.tingkat ?? "—"} · {r.tipe_kkm ?? "—"}
                  {r.tipe_kkm === "Angka" && r.nilai_kkm != null ? ` · ${r.nilai_kkm}` : ""}
                </div>
              </div>
              <Badge tone="neutral">{r.name}</Badge>
            </li>
          ))}
        </ul>
      )}

      <CreateResourceModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="KKM"
        title="Tambah KKM"
        description="Tetapkan KKM untuk mapel pada tahun ajaran ini."
        fields={fields}
        initialValues={{ tahun_ajaran: tahunAjaran, tipe_kkm: "Angka" }}
        onSuccess={() => void q.refetch()}
      />
    </SectionCard>
  );
}

// ── Detail page ───────────────────────────────────────────────────────────────

function TahunAjaranDetailPage() {
  const { name } = Route.useParams();
  return (
    <MasterDetailPage<Doc>
      doctype="Tahun Ajaran"
      name={name}
      eyebrow="Tahun Ajaran"
      parentLabel="Tahun Ajaran"
      parentPath="/sch/$sekolah/master/tahun-ajaran"
      title={(d) => d.nama || d.name}
      fields={[
        { label: "ID", render: (d) => <span className="font-mono text-xs">{d.name}</span> },
        { label: "Nama", render: (d) => d.nama || "—" },
        { label: "Tanggal Mulai", render: (d) => d.tanggal_mulai ?? "—" },
        { label: "Tanggal Selesai", render: (d) => d.tanggal_selesai ?? "—" },
        { label: "Status", render: (d) => <StatusBadge status={d.status} /> },
      ]}
      editFields={TAHUN_AJARAN_FIELDS}
      extraSections={(d) => (
        <>
          <SemesterSection tahunAjaran={d.name} />
          <KkmSection tahunAjaran={d.name} />
        </>
      )}
    />
  );
}

export const Route = createFileRoute("/sch/$sekolah/master/tahun-ajaran/$name")({
  component: TahunAjaranDetailPage,
});
