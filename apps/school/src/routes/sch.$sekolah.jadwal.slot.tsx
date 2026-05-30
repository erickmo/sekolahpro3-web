import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { useState } from "react";
import { type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";
import { ResourceCreateModal, type ResourceFieldDef } from "../components/shared/ResourceCreateModal";

type Row = { name: string; hari?: string; jam_mulai?: string; jam_selesai?: string; durasi_menit?: number; tipe?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "hari", header: "Hari", sortable: true, cell: (r) => r.hari ?? "—" },
  { key: "jam_mulai", header: "Mulai", cell: (r) => r.jam_mulai ?? "—" },
  { key: "jam_selesai", header: "Selesai", cell: (r) => r.jam_selesai ?? "—" },
  { key: "durasi_menit", header: "Durasi", align: "right", cell: (r) => r.durasi_menit ? `${r.durasi_menit} mnt` : "—" },
  { key: "tipe", header: "Tipe", cell: (r) => r.tipe ?? "—" },
];

const HARI_OPTIONS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((v) => ({ value: v, label: v }));
const TIPE_OPTIONS = ["Pelajaran", "Istirahat", "Upacara", "Sholat", "Lainnya"].map((v) => ({ value: v, label: v }));

const FIELDS: ResourceFieldDef[] = [
  { name: "hari", label: "Hari", type: "select", required: true, options: HARI_OPTIONS },
  { name: "tipe", label: "Tipe", type: "select", required: true, options: TIPE_OPTIONS },
  { name: "jam_mulai", label: "Jam Mulai", type: "text", required: true, hint: "Format HH:MM:SS" },
  { name: "jam_selesai", label: "Jam Selesai", type: "text", required: true, hint: "Format HH:MM:SS" },
  { name: "durasi_menit", label: "Durasi (menit)", type: "number" },
];

function SlotJadwalPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <ResourceListPage<Row>
        eyebrow="Jadwal"
        title="Slot Jadwal"
        description="Definisi slot waktu pelajaran (jam pelajaran, istirahat, upacara)."
        doctype="Slot Jadwal"
        fields={["name", "hari", "jam_mulai", "jam_selesai"]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "hari", dir: "asc" }}
        searchFields={["name", "hari"]}
        addLabel="Tambah Slot"
        onAdd={() => setOpen(true)}
        onRowClick={(r) => navigate({ to: "/sch/$sekolah/jadwal/slot/$name", params: { sekolah, name: r.name } })}
      />
      <ResourceCreateModal
        open={open}
        onClose={() => setOpen(false)}
        doctype="Slot Jadwal"
        title="Tambah Slot Jadwal"
        description="Definisikan slot waktu pelajaran baru."
        fields={FIELDS}
      />
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/jadwal/slot")({ component: SlotJadwalPage });
