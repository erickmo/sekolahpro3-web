import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, Button, SectionCard } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { MasterDetailPage, StatusBadge } from "../components/master/MasterDetailPage";
import { MasterCreateModal, type MasterFieldDef } from "../components/master/MasterCreateModal";
import { TAHUN_AJARAN_FIELDS, SEMESTER_FIELDS } from "../components/master/schemas";

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

function TahunAjaranDetailPage() {
  const { name } = Route.useParams();
  return (
    <MasterDetailPage<Doc>
      doctype="Tahun Ajaran"
      name={name}
      eyebrow="Tahun Ajaran"
      parentLabel="Tahun Ajaran"
      parentPath="/$sekolah/akademik/tahun-ajaran"
      title={(d) => d.nama || d.name}
      fields={[
        { label: "ID", render: (d) => <span className="font-mono text-xs">{d.name}</span> },
        { label: "Nama", render: (d) => d.nama || "—" },
        { label: "Tanggal Mulai", render: (d) => d.tanggal_mulai ?? "—" },
        { label: "Tanggal Selesai", render: (d) => d.tanggal_selesai ?? "—" },
        { label: "Status", render: (d) => <StatusBadge status={d.status} /> },
      ]}
      editFields={TAHUN_AJARAN_FIELDS}
      extraSections={(d) => <SemesterSection tahunAjaran={d.name} />}
    />
  );
}

export const Route = createFileRoute("/$sekolah/akademik/tahun-ajaran/$name")({
  component: TahunAjaranDetailPage,
});
