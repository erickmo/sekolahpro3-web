import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ExtraCreateModal, type ExtraFieldDef } from "../components/extra-shared/ExtraCreateModal";

type Row = { name: string; nama_wali: string; hubungan?: string; siswa?: string; nomor_telepon?: string; status?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "nama_wali", header: "Nama Wali", sortable: true, cell: (r) => r.nama_wali },
  { key: "hubungan", header: "Hubungan", cell: (r) => <Badge tone="neutral">{r.hubungan ?? "—"}</Badge> },
  { key: "siswa", header: "Siswa", cell: (r) => r.siswa ?? "—" },
  { key: "nomor_telepon", header: "No. Telepon", cell: (r) => r.nomor_telepon ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => <Badge tone={r.status === "Aktif" ? "success" : "neutral"} dot>{r.status ?? "—"}</Badge> },
];

const FORM_FIELDS: ExtraFieldDef[] = [
  { name: "nama_wali", label: "Nama Wali", type: "text", required: true },
  { name: "hubungan", label: "Hubungan", type: "select", required: true,
    options: ["Ayah", "Ibu", "Wali"].map((v) => ({ value: v, label: v })) },
  { name: "siswa", label: "Siswa (NIS)", type: "text", required: true, hint: "Masukkan ID siswa" },
  { name: "nomor_telepon", label: "No. Telepon", type: "text" },
  { name: "status", label: "Status", type: "select",
    options: ["Aktif", "Tidak Aktif"].map((v) => ({ value: v, label: v })), defaultValue: "Aktif" },
];

function WaliPage() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Siswa"
        title="Wali Siswa"
        doctype="Wali Siswa"
        fields={["name", "nama_wali", "hubungan", "siswa", "nomor_telepon", "status", "email", "alamat"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "nama_wali", dir: "asc" }}
        searchFields={["name", "nama_wali", "siswa"]}
        selectFilters={[
          { key: "hubungan", label: "Hubungan", field: "hubungan",
            options: ["Semua", "Ayah", "Ibu", "Wali"].map((v) => ({ value: v, label: v })) },
        ]}
        addLabel="Tambah Wali"
        onAdd={() => setOpen(true)}
        onRowClick={(r) => navigate({ to: "/siswa/wali/$name", params: { name: r.name } })}
      />
      <ExtraCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Wali Siswa"
        title="Tambah Wali Siswa"
        description="Catat data wali (orang tua / pengasuh) untuk siswa."
        fields={FORM_FIELDS}
      />
    </>
  );
}

export const Route = createFileRoute("/siswa/wali")({ component: WaliPage });
