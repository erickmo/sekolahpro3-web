import { createFileRoute } from "@tanstack/react-router";
import { type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

type Row = { name: string; jadwal_override?: string; slot_jadwal?: string; tipe?: string };

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "ID", sortable: true, cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
  { key: "jadwal_override", header: "Override", cell: (r) => r.jadwal_override ?? "—" },
  { key: "slot_jadwal", header: "Slot", cell: (r) => r.slot_jadwal ?? "—" },
  { key: "tipe", header: "Tipe", cell: (r) => r.tipe ?? "—" },
];

function SlotOverridePage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Jadwal"
      title="Slot Override"
      doctype="Slot Override"
      fields={["name"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "name", dir: "desc" }}
      searchFields={["name"]}
      addLabel="Tambah Slot Override"
      onAdd={() => alert("Form slot override (P2)")}
    />
  );
}

export const Route = createFileRoute("/jadwal/slot-override")({ component: SlotOverridePage });
